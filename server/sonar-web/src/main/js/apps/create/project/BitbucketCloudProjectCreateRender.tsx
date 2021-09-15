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
import * as React from 'react';
import { translate } from '../../../helpers/l10n';
import { getBaseUrl } from '../../../helpers/system';
import { BitbucketCloudRepository } from '../../../types/alm-integration';
import { AlmKeys, AlmSettingsInstance } from '../../../types/alm-settings';
import BitbucketCloudSearchForm from './BitbucketCloudSearchForm';
import CreateProjectPageHeader from './CreateProjectPageHeader';
import PersonalAccessTokenForm from './PersonalAccessTokenForm';
import WrongBindingCountAlert from './WrongBindingCountAlert';

export interface BitbucketCloudProjectCreateRendererProps {
  importingSlug?: string;
  isLastPage: boolean;
  canAdmin?: boolean;
  loading: boolean;
  loadingMore: boolean;
  onImport: (repositorySlug: string) => void;
  onLoadMore: () => void;
  onPersonalAccessTokenCreated: () => void;
  onSearch: (searchQuery: string) => void;
  repositories?: BitbucketCloudRepository[];
  resetPat: boolean;
  searching: boolean;
  searchQuery: string;
  showPersonalAccessTokenForm: boolean;
  settings?: AlmSettingsInstance;
}

export default function BitbucketCloudProjectCreateRenderer(
  props: BitbucketCloudProjectCreateRendererProps
) {
  const {
    importingSlug,
    isLastPage,
    settings,
    canAdmin,
    loading,
    loadingMore,
    repositories,
    resetPat,
    searching,
    searchQuery,
    showPersonalAccessTokenForm
  } = props;

  return (
    <>
      <CreateProjectPageHeader
        title={
          <span className="text-middle">
            <img
              alt="" // Should be ignored by screen readers
              className="spacer-right"
              height="24"
              src={`${getBaseUrl()}/images/alm/bitbucket.svg`}
            />
            {translate('onboarding.create_project.bitbucketcloud.title')}
          </span>
        }
      />
      {loading && <i className="spinner" />}

      {!loading && !settings && (
        <WrongBindingCountAlert alm={AlmKeys.BitbucketCloud} canAdmin={!!canAdmin} />
      )}

      {!loading &&
        settings &&
        (showPersonalAccessTokenForm ? (
          <PersonalAccessTokenForm
            almSetting={settings}
            resetPat={resetPat}
            onPersonalAccessTokenCreated={props.onPersonalAccessTokenCreated}
          />
        ) : (
          <BitbucketCloudSearchForm
            importingSlug={importingSlug}
            isLastPage={isLastPage}
            loadingMore={loadingMore}
            searchQuery={searchQuery}
            searching={searching}
            onImport={props.onImport}
            onSearch={props.onSearch}
            onLoadMore={props.onLoadMore}
            repositories={repositories}
          />
        ))}
    </>
  );
}
