export const EXPRESSION_TYPES = {
    SIMPLE: 'SIMPLE',
    SQL: 'SQL',
  };
  
  export const CLAUSES = {
    HAVING: 'HAVING',
    WHERE: 'WHERE',
  };
  
  const OPERATORS_TO_SQL = {
    '==': '=',
    '!=': '<>',
    '>': '>',
    '<': '<',
    '>=': '>=',
    '<=': '<=',
    in: 'in',
    'not in': 'not in',
    LIKE: 'like',
    regex: 'regex',
    'IS NOT NULL': 'IS NOT NULL',
    'IS NULL': 'IS NULL',
  };
  
  export default class AdhocFilterUrl {
    constructor(adhocFilterUrl) {
      this.expressionType = adhocFilterUrl.expressionType || EXPRESSION_TYPES.SIMPLE;
      if (this.expressionType === EXPRESSION_TYPES.SIMPLE) {
        this.Url = adhocFilterUrl.Url;
        this.colonneUrl = adhocFilterUrl.colonneUrl;
      }
      this.fromFormData = !!adhocFilterUrl.filterOptionName;
      this.filterOptionName = adhocFilterUrl.filterOptionName ||
        `filter_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    }
  
    duplicateWith(nextFields) {
      return new AdhocFilterUrl({
        ...this,
        Url: this.Url,
        expressionType: this.expressionType,
        colonneUrl: this.colonneUrl,
        ...nextFields,
      });
    }
  
    equals(adhocFilterUrl) {
      return adhocFilterUrl.expressionType === this.expressionType &&
        adhocFilterUrl.Url == this.Url &&
        adhocFilterUrl.sqlExpression === this.sqlExpression &&
        adhocFilterUrl.colonneUrl === this.colonneUrl;
    }
  
    isValid() {
      if (this.expressionType === EXPRESSION_TYPES.SIMPLE) {
        return(
          this.Url&&
          this.colonneUrl &&
          this.expressionType
        );
      }
      return false;
    }
  
    getDefaultLabel() {
      const label = this.translateToSql();
      return label.length < 43 ?
        label :
        label.substring(0, 40) + '...';
    }
  
    translateToSql() {
      const colonneUrl = this.colonneUrl;
      return `Table URL(${colonneUrl})`;
      }
  }
  