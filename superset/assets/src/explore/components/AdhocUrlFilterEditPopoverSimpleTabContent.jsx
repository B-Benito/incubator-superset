import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup,ControlLabel  } from 'react-bootstrap';
import VirtualizedSelect from 'react-virtualized-select';
import AdhocFilterUrl, { EXPRESSION_TYPES, CLAUSES } from '../AdhocFilterUrl';
import adhocMetricType from '../propTypes/adhocMetricType';
import columnType from '../propTypes/columnType';
import { t } from '../../locales';
import FilterDefinitionOption from './FilterDefinitionOption';
import OnPasteSelect from '../../components/OnPasteSelect';
import SelectControl from './controls/SelectControl';
import VirtualizedRendererWrap from '../../components/VirtualizedRendererWrap';

const $ = require('jquery');

const propTypes = {
  adhocFilterUrl: PropTypes.instanceOf(AdhocFilterUrl).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    columnType,
    PropTypes.shape({ saved_metric_name: PropTypes.string.isRequired }),
    adhocMetricType,
  ])).isRequired,
  onHeightChange: PropTypes.func.isRequired,
  datasource: PropTypes.object,
};

const defaultProps = {
  datasource: {},
};

const SINGLE_LINE_SELECT_CONTROL_HEIGHT = 30;

export default class AdhocUrlFilterEditPopoverSimpleTabContent extends React.Component {
  constructor(props) {
    super(props);
    this.onColonneUrlChange = this.onColonneUrlChange.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
    this.multiComparatorRef = this.multiComparatorRef.bind(this);

    this.state = {
      suggestions: [],
      multiComparatorHeight: SINGLE_LINE_SELECT_CONTROL_HEIGHT,
    };

    this.selectProps = {
      multi: false,
      name: 'select-column',
      labelKey: 'label',
      autosize: false,
      clearable: false,
      selectWrap: VirtualizedSelect,
    };
  }

  onColonneUrlChange(option) {
    let colonneUrl;
    let clause;
    // infer the new clause based on what Colonnes was selected.
    if (option && option.column_name) {
      colonneUrl = option.column_name;
      clause = CLAUSES.WHERE;
    }
    this.props.onChange(this.props.adhocFilterUrl.duplicateWith({
      colonneUrl,
      clause,
      expressionType: EXPRESSION_TYPES.SIMPLE,
    }));
  }

  onDashboardsChange(dashboards) {
    this.props.onChange(this.props.adhocFilterUrl.duplicateWith({
      dashboards,
      expressionType: EXPRESSION_TYPES.SIMPLE,
    }));
  }
  onUrlChange(Url) {
    this.props.onChange(this.props.adhocFilterUrl.duplicateWith({
      Url,
      expressionType: EXPRESSION_TYPES.SIMPLE,
    }));
  }

  onInputDashboardsChange(event) {
    this.onDashboardsChange(event.target.value);
  }

  onInputUrlChange(event) {
    this.onUrlChange(event.target.value);
  }

  handleMultiComparatorInputHeightChange() {
    if (this.multiComparatorComponent) {
      /* eslint-disable no-underscore-dangle */
      const multiComparatorDOMNode = this.multiComparatorComponent._selectRef &&
        this.multiComparatorComponent._selectRef.select &&
        this.multiComparatorComponent._selectRef.select.control;
      if (multiComparatorDOMNode) {
        if (multiComparatorDOMNode.clientHeight !== this.state.multiComparatorHeight) {
          this.props.onHeightChange((
            multiComparatorDOMNode.clientHeight - this.state.multiComparatorHeight
          ));
          this.setState({ multiComparatorHeight: multiComparatorDOMNode.clientHeight });
        }
      }
    }
  }


  focusUrl(ref) {
    if (ref) {
      ref.focus();
    }
  }

  multiComparatorRef(ref) {
    if (ref) {
      this.multiComparatorComponent = ref;
    }
  }

  render() {
    const { adhocFilterUrl, options, datasource } = this.props;

    let colonneUrlSelectProps = {
      value: adhocFilterUrl.colonneUrl ? { value: adhocFilterUrl.colonneUrl } : undefined,
      onChange: this.onColonneUrlChange,
      optionRenderer: VirtualizedRendererWrap(option => (
        <FilterDefinitionOption option={option} />
      )),
      valueRenderer: option => <span>{option.value}</span>,
      valueKey: 'ColonneUrl',
      noResultsText: t('No such column found. To filter on a metric, try the Custom SQL tab.'),
    };

    if (datasource.type === 'druid') {
      colonneUrlSelectProps = {
        ...colonneUrlSelectProps,
        placeholder: t('%s column(s) and metric(s)', options.length),
        options,
      };
    } else {
      // we cannot support simple ad-hoc filters for metrics because we don't know what type
      // the value should be cast to (without knowing the output type of the aggregate, which
      // becomes a rather complicated problem)
      colonneUrlSelectProps = {
        ...colonneUrlSelectProps,
        placeholder: adhocFilterUrl.clause === CLAUSES.WHERE ?
          t('%s column(s)', options.length) :
          t('To filter on a metric, use Custom SQL tab.'),
        options: options.filter(option => option.column_name),
      };
    }

    return (
      <span>
        <ControlLabel>Sélectionner la colonne URL</ControlLabel>
        <FormGroup>
          <OnPasteSelect {...this.selectProps} {...colonneUrlSelectProps} />
        </FormGroup>
        <ControlLabel>Entrer le lien Url</ControlLabel>
        <FormGroup>
          {<SelectControl
                multi={false}
                freeForm
                name="Url"
                value={adhocFilterUrl.Url}
                isLoading={false}
                choices={this.state.suggestions}
                onChange={this.onUrlChange}
                showHeader={false}
                noResultsText={t('Enter le lien Url')}
                refFunc={this.multiComparatorRef}
                disabled={false}
              />
          }
        </FormGroup>
      </span>
    );
  }
}
AdhocUrlFilterEditPopoverSimpleTabContent.propTypes = propTypes;
AdhocUrlFilterEditPopoverSimpleTabContent.defaultProps = defaultProps;
