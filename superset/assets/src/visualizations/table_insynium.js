import d3 from 'd3';
import dt from 'datatables.net-bs';

//import 'datatables.net-bs/css/dataTables.bootstrap.css';
import dompurify from 'dompurify';

import 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns-bs/js/fixedColumns.bootstrap.min.js'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'
import 'datatables.net-fixedcolumns-bs/css/fixedColumns.bootstrap.min.css'

import { fixDataTableBodyHeight, d3TimeFormatPreset } from '../modules/utils';
import './table_insynium.css';

require( 'datatables.net-bs' )();
require( 'datatables.net-fixedcolumns-bs' )();

const $ = require('jquery');
dt(window, $);

function TableInsyniumVis(slice, payload) {
  const container = $(slice.selector);
  const fC = d3.format('0,000');
  const data = payload.data;
  const fd = slice.formData;

  let metrics = (fd.metrics || []).map(m => m.label || m);
  // Add percent metrics
  metrics = metrics.concat((fd.percent_metrics || []).map(m => '%' + m));
  // Removing metrics (aggregates) that are strings
  metrics = metrics.filter(m => !isNaN(data.records[0][m]));

  function col(c) {
    const arr = [];
    for (let i = 0; i < data.records.length; i += 1) {
      arr.push(data.records[i][c]);
    }
    return arr;
  }
  const maxes = {};
  const mins = {};
  for (let i = 0; i < metrics.length; i += 1) {
    if (fd.align_pn) {
      maxes[metrics[i]] = d3.max(col(metrics[i]).map(Math.abs));
    } else {
      maxes[metrics[i]] = d3.max(col(metrics[i]));
      mins[metrics[i]] = d3.min(col(metrics[i]));
    }
  }

  const tsFormatter = d3TimeFormatPreset(fd.table_timestamp_format);

  const div = d3.select(slice.selector);
  div.html('');
  const table = div.append('table')
    .classed(
      'dataframe dataframe table table-striped ' +
      'table-condensed table-hover dataTable no-footer', true)
    .attr('width', '100%');

  const verboseMap = slice.datasource.verbose_map;
  const cols = data.columns.map((c) => {
    if (verboseMap[c]) {
      return verboseMap[c];
    }
    // Handle verbose names for percents
    if (c[0] === '%') {
      const cName = c.substring(1);
      return '% ' + (verboseMap[cName] || cName);
    }
    return c;
  });

  table.append('thead').append('tr')
    .selectAll('th')
    .data(cols)
    .enter()
    .append('th')
    .text(function (d) {
      return d;
    });

  const filters = slice.getFilters();
  table.append('tbody')
    .selectAll('tr')
    .data(data.records)
    .enter()
    .append('tr')
    .selectAll('td')
    // Dans cette exemple la variable c'est le paramètre de la colone .
    .data(row => data.columns.map((c) => {
      const val = row[c];

      //Zone de test des variables

      let html;
      const TestDate = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
      const isMetric = metrics.indexOf(c) >= 0;
      var isNumber=false;
      if (typeof (val) === 'string') {
        html = `<span class="like-pre">${dompurify.sanitize(val)}</span>`;
      }
      if(TestDate.test(val)){
      html = tsFormatter(val);
      }
      if (isMetric) {
        html = slice.d3format(c, val);
      }
      if (c[0] === '%') {
        html = d3.format('.3p')(val);
      }
      if(typeof(val)==='number'){
        if(fd.devise_columns.includes(c)){
          html= `<span class="right-align">${Intl.NumberFormat(fd.table_devise_format[0], { style: 'currency', currency:fd.table_devise_format[1], maximumFractionDigits: 2}).format(val)}</span>`;
          isNumber=true;
        }
        else if(fd.numeric_columns.includes(c)){
          html= `<span class="right-align">${Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 2 }).format(val)}</span>`;
          isNumber=true;
        }
      }
      return {
        col: c,
        val,
        html,
        isMetric,
        isNumber,
      };
    }))
    .enter()
    .append('td')
    .style('background-image', function (d) {
      if (d.isMetric) {
        const r = (fd.color_pn && d.val < 0) ? 150 : 0;
        if (fd.align_pn) {
          const perc = Math.abs(Math.round((d.val / maxes[d.col]) * 100));
          // The 0.01 to 0.001 is a workaround for what appears to be a
          // CSS rendering bug on flat, transparent colors
          return (
            `linear-gradient(to right, rgba(${r},0,0,0.2), rgba(${r},0,0,0.2) ${perc}%, ` +
            `rgba(0,0,0,0.01) ${perc}%, rgba(0,0,0,0.001) 100%)`
          );
        }
        const posExtent = Math.abs(Math.max(maxes[d.col], 0));
        const negExtent = Math.abs(Math.min(mins[d.col], 0));
        const tot = posExtent + negExtent;
        const perc1 = Math.round((Math.min(negExtent + d.val, negExtent) / tot) * 100);
        const perc2 = Math.round((Math.abs(d.val) / tot) * 100);
        // The 0.01 to 0.001 is a workaround for what appears to be a
        // CSS rendering bug on flat, transparent colors
        return (
          `linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.001) ${perc1}%, ` +
          `rgba(${r},0,0,0.2) ${perc1}%, rgba(${r},0,0,0.2) ${perc1 + perc2}%, ` +
          `rgba(0,0,0,0.01) ${perc1 + perc2}%, rgba(0,0,0,0.001) 100%)`
        );
      }
      return null;
    })
    .classed('text-right', d => d.isMetric || d.isNumber)
    .attr('title', (d) => {
      if (!isNaN(d.val)) {
        return fC(d.val);
      }
      return null;
    })
    .attr('data-sort', function (d) {
      return (d.isMetric) ? d.val : null;
    })
    // Check if the dashboard currently has a filter for each row
    .classed('filtered', d =>
      filters &&
      filters[d.col] &&
      filters[d.col].indexOf(d.val) >= 0,
    )
    .on('click', function (d) {
      if (!d.isMetric && fd.table_filter) {
        const td = d3.select(this);
        if (td.classed('filtered')) {
          slice.removeFilter(d.col, [d.val]);
          d3.select(this).classed('filtered', false);
        } else {
          d3.select(this).classed('filtered', true);
          slice.addFilter(d.col, [d.val]);
        }
      }
    })
    .style('cursor', function (d) {
      return (!d.isMetric) ? 'pointer' : '';
    })
    .html(d => d.html ? d.html : d.val);
  const height = slice.height();
  let paging = true;
  let pageLength;
  if (fd.page_length && fd.page_length > 0) {
    paging = true;
    pageLength = parseInt(fd.page_length, 10);
  }

  
  const datatable = container.find('.dataTable').DataTable({
    paging,
    pageLength,
    aaSorting: [],
    searching: fd.include_search,
    bInfo: false,
    scrollY: height + 'px',
    scrollCollapse: true,
    scrollX: true,
    fixedColumns:{leftColumns: fd.fixed_columns_gauche,rightColumns:fd.fixed_columns_droite}
  });

  fixDataTableBodyHeight(
      container.find('.dataTables_wrapper'), height);
  // Sorting table by main column
  let sortBy;
  if (fd.timeseries_limit_metric) {
    // Sort by as specified
    sortBy = fd.timeseries_limit_metric.label || fd.timeseries_limit_metric;
  } else if (metrics.length > 0) {
    // If not specified, use the first metric from the list
    sortBy = metrics[0];
  }
  if (sortBy) {
    datatable.column(data.columns.indexOf(sortBy)).order(fd.order_desc ? 'desc' : 'asc');
  }
  if (sortBy && metrics.indexOf(sortBy) < 0) {
    // Hiding the sortBy column if not in the metrics list
    datatable.column(data.columns.indexOf(sortBy)).visible(false);
  }
  datatable.draw();
  container.parents('.widget').find('.tooltip').remove();
}
module.exports = TableInsyniumVis;
