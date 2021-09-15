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
import { debounce, keyBy } from 'lodash';
import lunr, { LunrIndex } from 'lunr';
import * as React from 'react';
import { connect } from 'react-redux';
import { InjectedRouter } from 'react-router';
import { withRouter } from '../../../components/hoc/withRouter';
import { KeyCodes } from '../../../helpers/keycodes';
import { getSettingsAppAllDefinitions, Store } from '../../../store/rootReducer';
import { SettingCategoryDefinition } from '../../../types/settings';
import { ADDITIONAL_SETTING_DEFINITIONS, buildSettingLink } from '../utils';
import SettingsSearchRenderer from './SettingsSearchRenderer';

interface Props {
  className?: string;
  definitions: SettingCategoryDefinition[];
  router: InjectedRouter;
}

interface State {
  results?: SettingCategoryDefinition[];
  searchQuery: string;
  selectedResult?: string;
  showResults: boolean;
}

const DEBOUNCE_DELAY = 250;

export class SettingsSearch extends React.Component<Props, State> {
  definitionsByKey: T.Dict<SettingCategoryDefinition>;
  index: LunrIndex;
  state: State = {
    searchQuery: '',
    showResults: false
  };

  constructor(props: Props) {
    super(props);

    this.doSearch = debounce(this.doSearch, DEBOUNCE_DELAY);
    this.handleFocus = debounce(this.handleFocus, DEBOUNCE_DELAY);

    const definitions = props.definitions.concat(ADDITIONAL_SETTING_DEFINITIONS);
    this.index = this.buildSearchIndex(definitions);
    this.definitionsByKey = keyBy(definitions, 'key');
  }

  buildSearchIndex(definitions: SettingCategoryDefinition[]) {
    return lunr(function() {
      this.ref('key');
      this.field('key');
      this.field('name');
      this.field('description');
      this.field('splitkey');

      definitions.forEach(definition => {
        this.add({ ...definition, splitkey: definition.key.replace('.', ' ') });
      });
    });
  }

  doSearch = (query: string) => {
    const cleanQuery = query.replace(/[\^\-+:~*]/g, '');

    if (!cleanQuery) {
      this.setState({ showResults: false });
      return;
    }

    const results = this.index
      .search(
        cleanQuery
          .split(/\s+/)
          .map(s => `${s}~1 *${s}*`)
          .join(' ')
      )
      .map(match => this.definitionsByKey[match.ref]);

    this.setState({ showResults: true, results, selectedResult: results[0]?.key });
  };

  hideResults = () => {
    this.setState({ showResults: false });
  };

  handleFocus = () => {
    const { searchQuery, showResults } = this.state;
    if (searchQuery && !showResults) {
      this.setState({ showResults: true });
    }
  };

  handleSearchChange = (searchQuery: string) => {
    this.setState({ searchQuery });
    this.doSearch(searchQuery);
  };

  handleMouseOverResult = (key: string) => {
    this.setState({ selectedResult: key });
  };

  handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.keyCode) {
      case KeyCodes.Enter:
        event.preventDefault();
        this.openSelected();
        return;
      case KeyCodes.UpArrow:
        event.preventDefault();
        this.selectPrevious();
        return;
      case KeyCodes.DownArrow:
        event.preventDefault();
        this.selectNext();
        // keep this return to prevent fall-through in case more cases will be adder later
        // eslint-disable-next-line no-useless-return
        return;
    }
  };

  selectPrevious = () => {
    const { results, selectedResult } = this.state;

    if (results && selectedResult) {
      const index = results.findIndex(r => r.key === selectedResult);

      if (index > 0) {
        this.setState({ selectedResult: results[index - 1].key });
      }
    }
  };

  selectNext = () => {
    const { results, selectedResult } = this.state;

    if (results && selectedResult) {
      const index = results.findIndex(r => r.key === selectedResult);

      if (index < results.length - 1) {
        this.setState({ selectedResult: results[index + 1].key });
      }
    }
  };

  openSelected = () => {
    const { router } = this.props;
    const { selectedResult } = this.state;
    if (selectedResult) {
      const definition = this.definitionsByKey[selectedResult];
      router.push(buildSettingLink(definition));
      this.setState({ showResults: false });
    }
  };

  render() {
    const { className } = this.props;

    return (
      <SettingsSearchRenderer
        className={className}
        onClickOutside={this.hideResults}
        onMouseOverResult={this.handleMouseOverResult}
        onSearchInputChange={this.handleSearchChange}
        onSearchInputFocus={this.handleFocus}
        onSearchInputKeyDown={this.handleKeyDown}
        {...this.state}
      />
    );
  }
}

const mapStateToProps = (state: Store) => ({
  definitions: getSettingsAppAllDefinitions(state)
});

export default withRouter(connect(mapStateToProps)(SettingsSearch));
