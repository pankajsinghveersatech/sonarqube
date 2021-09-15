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
import { connect } from 'react-redux';
import { ClipboardButton } from '../../../components/controls/clipboard';
import { Alert } from '../../../components/ui/Alert';
import { toShortNotSoISOString } from '../../../helpers/dates';
import { translate } from '../../../helpers/l10n';
import { getAppState, Store } from '../../../store/rootReducer';
import PageActions from './PageActions';

export interface Props {
  isCluster: boolean;
  loading: boolean;
  logLevel: string;
  onLogLevelChange: () => void;
  productionDatabase: boolean;
  serverId?: string;
  showActions: boolean;
  version?: string;
}

export function PageHeader(props: Props) {
  const {
    isCluster,
    loading,
    logLevel,
    serverId,
    showActions,
    version,
    productionDatabase
  } = props;
  return (
    <header className="page-header">
      <h1 className="page-title">{translate('system_info.page')}</h1>
      {showActions && (
        <PageActions
          canDownloadLogs={!isCluster}
          canRestart={!isCluster}
          cluster={isCluster}
          logLevel={logLevel}
          onLogLevelChange={props.onLogLevelChange}
          serverId={serverId}
        />
      )}
      {loading && (
        <div className="page-actions">
          <i className="spinner" />
        </div>
      )}
      {serverId && version && (
        <div className="system-info-copy-paste-id-info boxed-group ">
          {!productionDatabase && (
            <Alert className="width-100" variant="warning">
              {translate('system.not_production_database_warning')}
            </Alert>
          )}
          <div className="display-flex-center">
            <div className="flex-1">
              <table className="width-100">
                <tbody>
                  <tr>
                    <th>
                      <strong>{translate('system.server_id')}</strong>
                    </th>
                    <td>
                      <code>{serverId}</code>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <strong>{translate('system.version')}</strong>
                    </th>
                    <td>{version}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ClipboardButton
              className="flex-0"
              copyValue={`SonarQube ID information
Server ID: ${serverId}
Version: ${version}
Date: ${toShortNotSoISOString(Date.now())}
`}>
              {translate('system.copy_id_info')}
            </ClipboardButton>
          </div>
        </div>
      )}
    </header>
  );
}

const mapStateToProps = (store: Store) => ({
  productionDatabase: getAppState(store).productionDatabase
});

export default connect(mapStateToProps)(PageHeader);
