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

  var listCol = [];   
  data.columns.map((c) => {
    listCol.push({"data": c});
  });

  const nbCol=listCol.length;

  const height = slice.height();
  let paging = true;
  let pageLength;
  if (fd.page_length && fd.page_length > 0) {
    paging = true;
    pageLength = parseInt(fd.page_length, 10);
  }

  var initalized=false;

  function formatNumberPage(){
    if (initalized) {
      const path = slice.selector+' table tbody tr td';
      $( path ).each(function(index) {
        var data = $( this ).text();
        var colEnCours = listCol[index%nbCol].data;

        const regexDate = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;
        if(regexDate.test(data)){
          $(this).html(tsFormatter(data));
        }

        if(fd.numeric_columns.includes(colEnCours) && $.isNumeric(data)){
          $(this).html(Intl.NumberFormat(fd.table_currency_format, { style: 'decimal', maximumFractionDigits: 2 }).format(data));
          $(this).addClass("text-right" );
        }

        if(fd.devise_columns.includes(colEnCours) && $.isNumeric(data)){
          $(this).html(Intl.NumberFormat(fd.table_currency_format, { style: 'currency', currency:fd.table_devise_format, maximumFractionDigits: 2}).format(data));
          $(this).addClass("text-right" );
        }
      });
      $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
    }
  }

  const datatable = container.find('.dataTable').DataTable({
    data:JSON.parse(data.records).data,
    columns:listCol,
    paging,
    pageLength,
    aaSorting: [],
    searching: fd.include_search,
    bInfo: false,
    scrollY: height + 'px',
    scrollCollapse: true,
    scrollX: true,
    fixedColumns:{leftColumns: fd.fixed_columns_gauche,rightColumns:fd.fixed_columns_droite},
    initComplete: function () {
      initalized=true;
    },
    drawCallback: formatNumberPage,
  });

  fixDataTableBodyHeight(container.find('.dataTables_wrapper'), height);
  datatable.draw();
}
module.exports = TableInsyniumVis;
