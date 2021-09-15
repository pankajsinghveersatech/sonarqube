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
import {
  getReportStatus,
  subscribeToEmailReport,
  unsubscribeFromEmailReport
} from '../../api/component-report';
import addGlobalSuccessMessage from '../../app/utils/addGlobalSuccessMessage';
import { translate, translateWithParameters } from '../../helpers/l10n';
import { isLoggedIn } from '../../helpers/users';
import { Store } from '../../store/rootReducer';
import { Branch } from '../../types/branch-like';
import { ComponentQualifier } from '../../types/component';
import { ComponentReportStatus } from '../../types/component-report';
import { withCurrentUser } from '../hoc/withCurrentUser';
import ComponentReportActionsRenderer from './ComponentReportActionsRenderer';

interface Props {
  appState: Pick<T.AppState, 'qualifiers'>;
  component: T.Component;
  branch?: Branch;
  currentUser: T.CurrentUser;
}

interface State {
  loadingStatus?: boolean;
  status?: ComponentReportStatus;
}

export class ComponentReportActions extends React.PureComponent<Props, State> {
  mounted = false;
  state: State = {};

  componentDidMount() {
    this.mounted = true;
    const governanceEnabled = this.props.appState.qualifiers.includes(ComponentQualifier.Portfolio);
    if (governanceEnabled) {
      this.loadReportStatus();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  loadReportStatus = async () => {
    const { component, branch } = this.props;

    const status = await getReportStatus(component.key, branch?.name).catch(() => undefined);

    if (this.mounted) {
      this.setState({ status, loadingStatus: false });
    }
  };

  handleSubscription = (subscribed: boolean) => {
    const { component } = this.props;
    const { status } = this.state;

    const translationKey = subscribed
      ? 'component_report.subscribe_x_success'
      : 'component_report.unsubscribe_x_success';
    const frequencyTranslation = translate(
      'report.frequency',
      status?.componentFrequency || status?.globalFrequency || ''
    ).toLowerCase();
    const qualifierTranslation = translate('qualifier', component.qualifier).toLowerCase();

    addGlobalSuccessMessage(
      translateWithParameters(translationKey, frequencyTranslation, qualifierTranslation)
    );

    this.loadReportStatus();
  };

  handleSubscribe = async () => {
    const { component, branch } = this.props;

    await subscribeToEmailReport(component.key, branch?.name);

    this.handleSubscription(true);
  };

  handleUnsubscribe = async () => {
    const { component, branch } = this.props;

    await unsubscribeFromEmailReport(component.key, branch?.name);

    this.handleSubscription(false);
  };

  render() {
    const { currentUser, component, branch } = this.props;
    const { status, loadingStatus } = this.state;

    if (loadingStatus || !status || (branch && !branch.excludedFromPurge)) {
      return null;
    }

    const currentUserHasEmail = isLoggedIn(currentUser) && !!currentUser.email;

    return (
      <ComponentReportActionsRenderer
        branch={branch}
        component={component}
        frequency={status.componentFrequency || status.globalFrequency}
        subscribed={status.subscribed}
        canSubscribe={status.canSubscribe}
        currentUserHasEmail={currentUserHasEmail}
        handleSubscription={this.handleSubscribe}
        handleUnsubscription={this.handleUnsubscribe}
      />
    );
  }
}

const mapStateToProps = (state: Store) => ({
  appState: state.appState
});

export default withCurrentUser(connect(mapStateToProps)(ComponentReportActions));
