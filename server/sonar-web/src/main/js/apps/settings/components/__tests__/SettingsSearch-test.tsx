/*
 * SonarQube
 * Copyright (C) 2009-2021 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import { shallow } from 'enzyme';
import * as React from 'react';
import { mockDefinition } from '../../../../helpers/mocks/settings';
import { mockRouter } from '../../../../helpers/testMocks';
import { mockEvent, waitAndUpdate } from '../../../../helpers/testUtils';
import { SettingsSearch } from '../SettingsSearch';

jest.mock('lunr', () => ({
  default: jest.fn(() => ({
    search: jest.fn(() => [
      {
        ref: 'foo'
      },
      {
        ref: 'sonar.new_code_period'
      }
    ])
  }))
}));

describe('instance', () => {
  const router = mockRouter();
  const wrapper = shallowRender({ router });

  it('should build the index', () => {
    expect(wrapper.instance().index).not.toBeNull();

    const def = mockDefinition();
    expect(wrapper.instance().definitionsByKey).toEqual(
      expect.objectContaining({ [def.key]: def })
    );
  });

  it('should handle search', async () => {
    wrapper.instance().handleSearchChange('query');

    await waitAndUpdate(wrapper);
    expect(wrapper.state().searchQuery).toBe('query');

    expect(wrapper.instance().index.search).toBeCalled();
    expect(wrapper.state().showResults).toBe(true);
    expect(wrapper.state().results).toHaveLength(2);
  });

  it('should handle empty search', async () => {
    wrapper.instance().handleSearchChange('');

    await waitAndUpdate(wrapper);
    expect(wrapper.state().searchQuery).toBe('');

    expect(wrapper.instance().index.search).toBeCalled();
    expect(wrapper.state().showResults).toBe(false);
  });

  it('should hide results', () => {
    wrapper.setState({ showResults: true });
    wrapper.instance().hideResults();
    expect(wrapper.state().showResults).toBe(false);
    wrapper.instance().hideResults();
  });

  it('should handle focus', () => {
    wrapper.setState({ searchQuery: 'hi', showResults: false });
    wrapper.instance().handleFocus();
    expect(wrapper.state().showResults).toBe(true);

    wrapper.setState({ searchQuery: '', showResults: false });
    wrapper.instance().handleFocus();
    expect(wrapper.state().showResults).toBe(false);
  });

  it('should handle mouseover', () => {
    wrapper.setState({ selectedResult: undefined });
    wrapper.instance().handleMouseOverResult('selection');
    expect(wrapper.state().selectedResult).toBe('selection');
  });

  it('should handle "enter" keyboard event', () => {
    wrapper.setState({ selectedResult: undefined });
    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 13 }));
    expect(router.push).not.toBeCalled();

    wrapper.setState({ selectedResult: 'foo' });
    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 13 }));

    expect(router.push).toBeCalledWith({
      hash: '#foo',
      pathname: '/admin/settings',
      query: { category: 'foo category' }
    });
  });

  it('should handle "down" keyboard event', () => {
    wrapper.setState({ selectedResult: undefined });
    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 40 }));
    expect(wrapper.state().selectedResult).toBeUndefined();

    wrapper.setState({ selectedResult: 'foo' });
    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 40 }));
    expect(wrapper.state().selectedResult).toBe('sonar.new_code_period');

    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 40 }));
    expect(wrapper.state().selectedResult).toBe('sonar.new_code_period');
  });

  it('should handle "up" keyboard event', () => {
    wrapper.setState({ selectedResult: undefined });
    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 38 }));
    expect(wrapper.state().selectedResult).toBeUndefined();

    wrapper.setState({ selectedResult: 'sonar.new_code_period' });
    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 38 }));
    expect(wrapper.state().selectedResult).toBe('foo');

    wrapper.instance().handleKeyDown(mockEvent({ keyCode: 38 }));
    expect(wrapper.state().selectedResult).toBe('foo');
  });
});

function shallowRender(overrides: Partial<SettingsSearch['props']> = {}) {
  return shallow<SettingsSearch>(
    <SettingsSearch definitions={[mockDefinition()]} router={mockRouter()} {...overrides} />
  );
}
