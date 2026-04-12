import { describe, expect, it } from 'vitest';
import { getResponseArray, getResponseObject } from './responseGuards';

describe('responseGuards', () => {
  it('returns array from response.data', () => {
    expect(getResponseArray({ data: [1, 2] })).toEqual([1, 2]);
  });

  it('returns array when response itself is an array', () => {
    expect(getResponseArray(['a'])).toEqual(['a']);
  });

  it('returns empty array for invalid shapes', () => {
    expect(getResponseArray({ data: null })).toEqual([]);
    expect(getResponseArray(null)).toEqual([]);
  });

  it('returns object from response.data wrapper', () => {
    expect(getResponseObject({ data: { key: 'value' } })).toEqual({ key: 'value' });
  });

  it('returns object itself when no data wrapper is present', () => {
    expect(getResponseObject({ key: 'value' })).toEqual({ key: 'value' });
  });

  it('returns empty object for invalid payloads', () => {
    expect(getResponseObject(undefined)).toEqual({});
    expect(getResponseObject(null)).toEqual({});
  });
});
