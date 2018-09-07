import d3 from 'd3';
import dt from 'datatables.net-bs';
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
        var val = $( this ).text();
        var numColEncours = index%nbCol;
        var colEnCours = listCol[numColEncours].data;

        const regexDate = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;
        if(regexDate.test(val)){
          $(this).html(tsFormatter(val));
        }

        if(fd.numeric_columns.includes(colEnCours) && $.isNumeric(val)){
          $(this).html(Intl.NumberFormat(fd.table_currency_format, { style: 'decimal', maximumFractionDigits: 2 }).format(val));
          $(this).addClass("text-right" );
        }

        if(fd.devise_columns.includes(colEnCours) && $.isNumeric(val)){
          $(this).html(Intl.NumberFormat(fd.table_currency_format, { style: 'currency', currency:fd.table_devise_format, maximumFractionDigits: 2}).format(val));
          $(this).addClass("text-right" );
        }


        if(fd.adhoc_url_filters != null){
          for (let A = 0; A < fd.adhoc_url_filters.length; A++) {
            const object = fd.adhoc_url_filters[A];
            if (object.colonneUrl.includes(colEnCours)){
              var url = object.Url;
              var splitUrl=url.split("$");
              var myurl="";
              for (let indexA = 0; indexA < splitUrl.length; indexA++) {
                var element = splitUrl[indexA];
                if (indexA%2!=0) {
                  var max=nbCol-(index%nbCol)-1;
                  var min=nbCol-max-1;

                  var next=$(this)
                  for (let cptNext = 0; cptNext < max; cptNext++) {
                    next = next.next();
                    if (next.index()==data.columns.indexOf(element)) {
                      element= next.text();
                    }           
                  }

                  var prev=$(this)
                  for (let cptPrev = 0; cptPrev < min; cptPrev++) {
                    prev = prev.prev();
                    if (prev.index()==data.columns.indexOf(element)) {
                      element= prev.text();
                    }           
                  }                  
                }
                myurl+=element;
              }
              myurl=encodeURI(myurl);
              $(this).html(`<a href="${myurl}">${val}</a>`);
            }
          };
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
