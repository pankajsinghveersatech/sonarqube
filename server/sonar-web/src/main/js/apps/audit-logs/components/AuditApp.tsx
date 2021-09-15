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
import { getAppState, getGlobalSettingValue, Store } from '../../../store/rootReducer';
import { AdminPageExtension } from '../../../types/extension';
import { fetchValues } from '../../settings/store/actions';
import '../style.css';
import { HousekeepingPolicy, RangeOption } from '../utils';
import AuditAppRenderer from './AuditAppRenderer';

interface Props {
  auditHousekeepingPolicy: HousekeepingPolicy;
  fetchValues: typeof fetchValues;
  hasGovernanceExtension?: boolean;
}

interface State {
  dateRange?: { from?: Date; to?: Date };
  downloadStarted: boolean;
  selection: RangeOption;
}

export class AuditApp extends React.PureComponent<Props, State> {
  state: State = {
    downloadStarted: false,
    selection: RangeOption.Today
  };

  componentDidMount() {
    const { hasGovernanceExtension } = this.props;
    if (hasGovernanceExtension) {
      this.props.fetchValues('sonar.dbcleaner.auditHousekeeping');
    }
  }

  handleDateSelection = (dateRange: { from?: Date; to?: Date }) =>
    this.setState({ dateRange, downloadStarted: false, selection: RangeOption.Custom });

  handleOptionSelection = (selection: RangeOption) =>
    this.setState({ dateRange: undefined, downloadStarted: false, selection });

  handleStartDownload = () => {
    setTimeout(() => {
      this.setState({ downloadStarted: true });
    }, 0);
  };

  render() {
    const { hasGovernanceExtension, auditHousekeepingPolicy } = this.props;

    return hasGovernanceExtension ? (
      <AuditAppRenderer
        handleDateSelection={this.handleDateSelection}
        handleOptionSelection={this.handleOptionSelection}
        handleStartDownload={this.handleStartDownload}
        housekeepingPolicy={auditHousekeepingPolicy || HousekeepingPolicy.Monthly}
        {...this.state}
      />
    ) : null;
  }
}

const mapDispatchToProps = { fetchValues };

const mapStateToProps = (state: Store) => {
  const settingValue = getGlobalSettingValue(state, 'sonar.dbcleaner.auditHousekeeping');
  const { adminPages } = getAppState(state);
  const hasGovernanceExtension = Boolean(
    adminPages?.find(e => e.key === AdminPageExtension.GovernanceConsole)
  );
  return {
    auditHousekeepingPolicy: settingValue?.value as HousekeepingPolicy,
    hasGovernanceExtension
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AuditApp);
