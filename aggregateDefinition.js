'use strict';

var FACT = "(fact)", DIMENSION = "(dimension)", ENUM = "(enum)", BOOLEAN = "(boolean)", STRING = "(string)";

var AggregateModel = (function () {
  function AggregateModel(definition) {
    var factDefinitions = [];
    var dimensionDefinitions = [];
    var dictionary = {};

    this.enums = [];
    this.dimensions = [];
    this.facts = [];

    for (var i = 0; i < definition.length; i++) {
      var factName = definition[i]["fact"];
      var enumName = definition[i]["enum"];
      var dimensionName = definition[i]["dimension"];

      if (null != factName) {
        var fact = new FactDefinition(factName);
        factDefinitions.push(new ModelDefinitionPair(fact, definition[i]));
        this.facts.push(fact);
        dictionary[factName] = FACT;
        if (definition[i]["root"] === true) this.aggregate = fact;
      }
      if (null != enumName) {
        this.enums.push(new EnumDefinition(definition[i]));
        dictionary[enumName] = ENUM;
      }
      if (null != dimensionName) {
        var dimension = new DimensionDefinition(dimensionName, definition[i]);
        dimensionDefinitions.push(new ModelDefinitionPair(dimension, definition[i]));
        this.dimensions.push(dimension);
        dictionary[dimensionName] = DIMENSION;
      }
    }

    for (i = 0; i < dimensionDefinitions.length; i++) {
      var matchedDimensionDefinition = [], relationship = dimensionDefinitions[i].getDefinition()["has"];
      if (null != relationship) {
        matchedDimensionDefinition = $.grep(dimensionDefinitions, function (e) {
          return e.getModel().hasName(relationship);
        });
      }
      if (matchedDimensionDefinition.length != 0) {
        dimensionDefinitions[i].getModel().setParent(matchedDimensionDefinition[0].getModel());
      }
    }

    for (i = 0; i < factDefinitions.length; i++) {
      var fields = factDefinitions[i].getDefinition()["has"];
      var currentFact = factDefinitions[i].getModel();
      for (var j = 0; j < fields.length; j++) {
        var fieldName = fields[j].match(/(\w*\s*)*/)[0];
        switch (dictionary[fieldName]) {
          case FACT :
            currentFact.addFact(matchByFieldName(factDefinitions, fieldName));
            break;
          case DIMENSION :
            currentFact.addDimension(matchByFieldName(dimensionDefinitions, fieldName));
            break;
          case ENUM :
            $.grep(this.enums, function (e) {
              return e.hasName(fieldName);
            });
            currentFact.addEnum(getItemsByName(this.enums, fieldName)[0]);
            break;
          default :
            var fieldType = fields[j].match(/\50\w*\51/);
            fieldType = (fieldType == null) ? "(string)" : fieldType[0];
            currentFact.addField(fieldName, fieldType);
            break;
        }
      }
    }

    function matchByFieldName(definitions, fieldName) {
      var matchedItems = $.grep(definitions, function (e) {
        return e.getModel().hasName(fieldName);
      });
      return matchedItems[0].getModel();
    }
  }

  AggregateModel.prototype.getEnums = function () {
    return this.enums;
  };

  AggregateModel.prototype.getEnum = function (name) {
    return getItemByName(this.enums, name);
  };

  AggregateModel.prototype.getDimensions = function () {
    return this.dimensions;
  };

  AggregateModel.prototype.getFacts = function () {
    return this.facts;
  };

  AggregateModel.prototype.getFactDefinition = function (factName) {
    return getItemByName(this.facts, factName);
  };

  AggregateModel.prototype.getAggregate = function () {
    return this.aggregate;
  };

  return AggregateModel;
})();

function getItemByName(arrayObj, name) {
  var items = getItemsByName(arrayObj, name);
  return (items.length == 1) ? items[0] : null;
};

function getItemsByName(arrayObj, name) {
  return $.grep(arrayObj, function (e) {
    return e.hasName(name);
  });
}

function hasItemByName(arrayObj, name) {
  return getItemsByName(arrayObj, name).length == 1;
}

var FactDefinition = (function () {
  function FactDefinition(name) {
    this.name = name;
    this.facts = [];
    this.dimensions = [];
    this.enums = [];
    this.fields = {};
  }

  FactDefinition.prototype.getName = function () {
    return this.name;
  };

  FactDefinition.prototype.hasName = function (name) {
    return this.name === name;
  };

  FactDefinition.prototype.addFact = function (fact) {
    this.fields[fact.getName()] = "(fact)";
    return this.facts.push(fact);
  };

  FactDefinition.prototype.addDimension = function (dimension) {
    this.fields[dimension.getName()] = "(dimension)";
    return this.dimensions.push(dimension);
  };

  FactDefinition.prototype.addEnum = function (enumeration) {
    this.fields[enumeration.getName()] = "(enum)";
    return this.enums.push(enumeration);
  };

  FactDefinition.prototype.addField = function (field, fieldType) {
    return this.fields[field] = fieldType;
  };

  FactDefinition.prototype.hasFactByName = function (factName) {
    return hasItemByName(this.facts, factName);
  };

  FactDefinition.prototype.hasEnumByName = function (enumName) {
    return hasItemByName(this.enums, enumName);
  };

  FactDefinition.prototype.hasFieldByName = function (fieldName) {
    return this.fields[fieldName] !== undefined;
  };

  FactDefinition.prototype.fieldNames = function () {
    return Object.keys(this.fields);
  };

  FactDefinition.prototype.isFieldBoolean = function (fieldName) {
    return this.fields[fieldName] === BOOLEAN;
  };

  FactDefinition.prototype.isFieldEnum = function (fieldName) {
    return this.fields[fieldName] === ENUM;
  };

  FactDefinition.prototype.isFieldString = function (fieldName) {
    return this.fields[fieldName] === STRING
  };

  FactDefinition.prototype.isFieldFact = function (fieldName) {
    return this.fields[fieldName] === FACT;
  };

  FactDefinition.prototype.fieldType = function (fieldName) {
    return this.fields[fieldName];
  };

  FactDefinition.prototype.newInstance = function () {
    return new Fact(this);
  };

  return FactDefinition;
})();

var Fact = (function () {
  function Fact(factDefinition) {
    this.factDefinition = factDefinition;
    this.fields = [];
    factDefinition.fieldNames().forEach(function (fieldName) {
      this.fields.push(new Field(fieldName, factDefinition.fieldType(fieldName)));
    }, this);
    this.childFacts = [];
  }

  Fact.prototype.addChildFact = function (childFactDefinition) {
    this.childFacts.push(new Fact(childFactDefinition));
  };

  Fact.prototype.getFactDefinition = function () {
    return this.factDefinition;
  };

  Fact.prototype.getField = function (fieldName) {
    return getItemByName(this.fields, fieldName);
  };

  Fact.prototype.getFieldValue = function (fieldName) {
    return this.getField(fieldName).getValue();
  };

  Fact.prototype.getChildFacts = function () {
    return this.childFacts;
  };

  Fact.prototype.toJSON = function () {
    return {fields: this.fields, childFacts : this.childFacts};
  };

  return Fact;
})();

var Field = (function () {
  function Field(name, type) {
    this.name = name;
    this.type = type;
    this.fieldValue = {
      value: null
    };
  }

  Field.prototype.hasName = function (name) {
    return this.name === name;
  };

  Field.prototype.getValue = function () {
    return this.fieldValue;
  };

  Field.prototype.toJSON = function () {
    return {name: this.name, value : fieldValue.value, type : this.type};
  };

  return Field;
})();

var EnumDefinition = (function () {
  function EnumDefinition(definition) {
    this.name = definition["enum"];
    this.values = definition["values"];
  }

  EnumDefinition.prototype.getName = function () {
    return this.name;
  };

  EnumDefinition.prototype.hasName = function (name) {
    return this.name === name;
  };

  EnumDefinition.prototype.getValues = function () {
    return this.values;
  };

  return EnumDefinition;
})();

var DimensionDefinition = (function () {
  function DimensionDefinition(name, definition) {
    this.name = name;
    this.values = definition["values"];
  }

  DimensionDefinition.prototype.getName = function () {
    return this.name;
  };

  DimensionDefinition.prototype.hasName = function (name) {
    return this.name === name;
  };

  DimensionDefinition.prototype.setParent = function (parentDimension) {
    this.parent = parentDimension;
  };

  DimensionDefinition.prototype.hasParentByName = function (parentName) {
    return this.parent.hasName(parentName);
  };

  return DimensionDefinition;
})();

var ModelDefinitionPair = (function () {
  function ModelDefinitionPair(model, definition) {
    this.model = model;
    this.definition = definition;
  }

  ModelDefinitionPair.prototype.getModel = function () {
    return this.model;
  };

  ModelDefinitionPair.prototype.getDefinition = function () {
    return this.definition;
  };

  return ModelDefinitionPair;
})();

//a.match(/\50\w*\51/)