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
import * as classNames from 'classnames';
import { sortBy } from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { IndexLink } from 'react-router';
import { getGlobalSettingsUrl, getProjectSettingsUrl } from '../../../helpers/urls';
import { getAppState, getSettingsAppAllCategories, Store } from '../../../store/rootReducer';
import { getCategoryName } from '../utils';
import { ADDITIONAL_CATEGORIES } from './AdditionalCategories';
import CATEGORY_OVERRIDES from './CategoryOverrides';

export interface CategoriesListProps {
  branchesEnabled?: boolean;
  categories: string[];
  component?: T.Component;
  defaultCategory: string;
  selectedCategory: string;
}

export function CategoriesList(props: CategoriesListProps) {
  const { branchesEnabled, categories, component, defaultCategory, selectedCategory } = props;

  const categoriesWithName = categories
    .filter(key => !CATEGORY_OVERRIDES[key.toLowerCase()])
    .map(key => ({
      key,
      name: getCategoryName(key)
    }))
    .concat(
      ADDITIONAL_CATEGORIES.filter(c => c.displayTab)
        .filter(c =>
          component
            ? // Project settings
              c.availableForProject
            : // Global settings
              c.availableGlobally
        )
        .filter(c => branchesEnabled || !c.requiresBranchesEnabled)
    );
  const sortedCategories = sortBy(categoriesWithName, category => category.name.toLowerCase());

  return (
    <ul className="side-tabs-menu">
      {sortedCategories.map(c => {
        const category = c.key !== defaultCategory ? c.key.toLowerCase() : undefined;
        return (
          <li key={c.key}>
            <IndexLink
              className={classNames({
                active: c.key.toLowerCase() === selectedCategory.toLowerCase()
              })}
              title={c.name}
              to={
                component
                  ? getProjectSettingsUrl(component.key, category)
                  : getGlobalSettingsUrl(category)
              }>
              {c.name}
            </IndexLink>
          </li>
        );
      })}
    </ul>
  );
}

const mapStateToProps = (state: Store) => ({
  categories: getSettingsAppAllCategories(state),
  branchesEnabled: getAppState(state).branchesEnabled
});

export default connect(mapStateToProps)(CategoriesList);
