/* eslint-disable max-classes-per-file */
import { describe, expect, it, jest } from '@jest/globals';
import { Component, Query } from '.';
import { QueryDescription } from './query';

jest.mock('./entity');

class TestComponentOne extends Component {}

class TestComponentTwo extends Component {}

class TestComponentThree extends Component {}

class TestComponentFour extends Component {}

class TestComponentFive extends Component {}

class TestComponentSix extends Component {}

describe('Query', () => {
  it('should throw an error when constructing if the query is malformed', () => {
    expect(() => new Query({})).toThrowError();

    expect(() => new Query({ all: [] })).toThrowError();
    expect(() => new Query({ one: [] })).toThrowError();
    expect(() => new Query({ not: [] })).toThrowError();

    expect(
      () =>
        new Query({
          all: [],
          one: [TestComponentTwo],
          not: [TestComponentThree],
        })
    ).toThrowError();
    expect(
      () =>
        new Query({
          all: [TestComponentOne],
          one: [],
          not: [TestComponentThree],
        })
    ).toThrowError();
    expect(
      () =>
        new Query({
          all: [TestComponentOne],
          one: [TestComponentTwo],
          not: [],
        })
    ).toThrowError();

    expect(() => new Query([])).toThrowError();
  });

  describe('getKey', () => {
    it('should contain class names', () => {
      const queryOne: QueryDescription = {
        all: [TestComponentOne, TestComponentTwo],
      };

      expect(Query.getDescriptionDedupeString(queryOne)).toEqual(
        'TestComponentOne&TestComponentTwo'
      );
    });

    it('should return the same key for two matching query descriptions', () => {
      const queryOne: QueryDescription = {
        one: [TestComponentOne, TestComponentTwo],
        all: [TestComponentThree, TestComponentFour],
        not: [TestComponentFive, TestComponentSix],
      };

      const queryTwo: QueryDescription = {
        not: [TestComponentSix, TestComponentFive],
        all: [TestComponentFour, TestComponentThree],
        one: [TestComponentTwo, TestComponentOne],
      };

      expect(Query.getDescriptionDedupeString(queryOne)).toEqual(
        Query.getDescriptionDedupeString(queryTwo)
      );
    });

    it('should return a different key for two different query descriptions', () => {
      const differentComponentsOne: QueryDescription = {
        all: [TestComponentOne, TestComponentTwo],
      };

      const differentComponentsTwo: QueryDescription = {
        all: [TestComponentOne],
      };

      expect(
        Query.getDescriptionDedupeString(differentComponentsOne)
      ).not.toEqual(Query.getDescriptionDedupeString(differentComponentsTwo));

      const differentConditionOne: QueryDescription = {
        all: [TestComponentOne],
      };

      const differentConditionTwo: QueryDescription = {
        not: [TestComponentOne],
      };

      expect(
        Query.getDescriptionDedupeString(differentConditionOne)
      ).not.toEqual(Query.getDescriptionDedupeString(differentConditionTwo));

      const partiallyDifferentOne: QueryDescription = {
        all: [TestComponentOne],
      };

      const partiallyDifferentTwo: QueryDescription = {
        all: [TestComponentOne],
        not: [TestComponentTwo],
      };

      expect(
        Query.getDescriptionDedupeString(partiallyDifferentOne)
      ).not.toEqual(Query.getDescriptionDedupeString(partiallyDifferentTwo));
    });
  });
});
