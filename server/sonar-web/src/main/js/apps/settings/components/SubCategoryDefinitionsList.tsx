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
import { groupBy, isEqual, sortBy } from 'lodash';
import * as React from 'react';
import { Location, withRouter } from '../../../components/hoc/withRouter';
import { sanitizeStringRestricted } from '../../../helpers/sanitize';
import { scrollToElement } from '../../../helpers/scrolling';
import { SettingWithCategory } from '../../../types/settings';
import { getSubCategoryDescription, getSubCategoryName } from '../utils';
import DefinitionsList from './DefinitionsList';
import EmailForm from './EmailForm';

export interface SubCategoryDefinitionsListProps {
  category: string;
  component?: T.Component;
  fetchValues: Function;
  location: Location;
  settings: Array<SettingWithCategory>;
  subCategory?: string;
}

const SCROLL_OFFSET_TOP = 200;
const SCROLL_OFFSET_BOTTOM = 500;

export class SubCategoryDefinitionsList extends React.PureComponent<
  SubCategoryDefinitionsListProps
> {
  componentDidMount() {
    this.fetchValues();
  }

  componentDidUpdate(prevProps: SubCategoryDefinitionsListProps) {
    const prevKeys = prevProps.settings.map(setting => setting.definition.key);
    const keys = this.props.settings.map(setting => setting.definition.key);
    if (prevProps.component !== this.props.component || !isEqual(prevKeys, keys)) {
      this.fetchValues();
    }

    const { hash } = this.props.location;
    if (hash && prevProps.location.hash !== hash) {
      const query = `[data-key=${hash.substr(1).replace(/[.#/]/g, '\\$&')}]`;
      const element = document.querySelector<HTMLHeadingElement | HTMLLIElement>(query);
      this.scrollToSubCategoryOrDefinition(element);
    }
  }

  scrollToSubCategoryOrDefinition = (element: HTMLHeadingElement | HTMLLIElement | null) => {
    if (element) {
      const { hash } = this.props.location;
      if (hash && hash.substr(1) === element.getAttribute('data-key')) {
        scrollToElement(element, {
          topOffset: SCROLL_OFFSET_TOP,
          bottomOffset: SCROLL_OFFSET_BOTTOM,
          smooth: true
        });
      }
    }
  };

  fetchValues() {
    const keys = this.props.settings.map(setting => setting.definition.key).join();
    return this.props.fetchValues(keys, this.props.component && this.props.component.key);
  }

  renderEmailForm = (subCategoryKey: string) => {
    const isEmailSettings = this.props.category === 'general' && subCategoryKey === 'email';
    if (!isEmailSettings) {
      return null;
    }
    return <EmailForm />;
  };

  render() {
    const bySubCategory = groupBy(this.props.settings, setting => setting.definition.subCategory);
    const subCategories = Object.keys(bySubCategory).map(key => ({
      key,
      name: getSubCategoryName(bySubCategory[key][0].definition.category, key),
      description: getSubCategoryDescription(bySubCategory[key][0].definition.category, key)
    }));
    const sortedSubCategories = sortBy(subCategories, subCategory =>
      subCategory.name.toLowerCase()
    );
    const filteredSubCategories = this.props.subCategory
      ? sortedSubCategories.filter(c => c.key === this.props.subCategory)
      : sortedSubCategories;
    return (
      <ul className="settings-sub-categories-list">
        {filteredSubCategories.map(subCategory => (
          <li key={subCategory.key}>
            <h2
              className="settings-sub-category-name"
              data-key={subCategory.key}
              ref={this.scrollToSubCategoryOrDefinition}>
              {subCategory.name}
            </h2>
            {subCategory.description != null && (
              <div
                className="settings-sub-category-description markdown"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: sanitizeStringRestricted(subCategory.description)
                }}
              />
            )}
            <DefinitionsList
              component={this.props.component}
              scrollToDefinition={this.scrollToSubCategoryOrDefinition}
              settings={bySubCategory[subCategory.key]}
            />
            {this.renderEmailForm(subCategory.key)}
          </li>
        ))}
      </ul>
    );
  }
}

export default withRouter(SubCategoryDefinitionsList);
