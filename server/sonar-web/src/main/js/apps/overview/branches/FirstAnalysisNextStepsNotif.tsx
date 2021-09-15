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
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';
import { withCurrentUser } from '../../../components/hoc/withCurrentUser';
import DismissableAlert from '../../../components/ui/DismissableAlert';
import { translate } from '../../../helpers/l10n';
import { isLoggedIn } from '../../../helpers/users';
import { ProjectAlmBindingResponse } from '../../../types/alm-settings';
import { ComponentQualifier } from '../../../types/component';
import { PULL_REQUEST_DECORATION_BINDING_CATEGORY } from '../../settings/components/AdditionalCategoryKeys';

export interface FirstAnalysisNextStepsNotifProps {
  branchesEnabled?: boolean;
  component: T.Component;
  currentUser: T.CurrentUser;
  detectedCIOnLastAnalysis?: boolean;
  projectBinding?: ProjectAlmBindingResponse;
}

export function FirstAnalysisNextStepsNotif(props: FirstAnalysisNextStepsNotifProps) {
  const {
    component,
    currentUser,
    branchesEnabled,
    detectedCIOnLastAnalysis,
    projectBinding
  } = props;

  if (!isLoggedIn(currentUser) || component.qualifier !== ComponentQualifier.Project) {
    return null;
  }

  const showConfigurePullRequestDecoNotif = branchesEnabled && projectBinding === undefined;
  const showConfigureCINotif =
    detectedCIOnLastAnalysis !== undefined ? !detectedCIOnLastAnalysis : false;

  if (!showConfigureCINotif && !showConfigurePullRequestDecoNotif) {
    return null;
  }

  const showOnlyConfigureCI = showConfigureCINotif && !showConfigurePullRequestDecoNotif;
  const showOnlyConfigurePR = showConfigurePullRequestDecoNotif && !showConfigureCINotif;
  const showBoth = showConfigureCINotif && showConfigurePullRequestDecoNotif;
  const isProjectAdmin = component.configuration?.showSettings;
  const tutorialsLink = (
    <Link
      to={{
        pathname: '/tutorials',
        query: { id: component.key }
      }}>
      {translate('overview.project.next_steps.links.set_up_ci')}
    </Link>
  );
  const projectSettingsLink = (
    <Link
      to={{
        pathname: '/project/settings',
        query: {
          id: component.key,
          category: PULL_REQUEST_DECORATION_BINDING_CATEGORY
        }
      }}>
      {translate('overview.project.next_steps.links.project_settings')}
    </Link>
  );

  return (
    <DismissableAlert alertKey={`config_ci_pr_deco.${component.key}`} variant="info">
      {showOnlyConfigureCI && (
        <FormattedMessage
          defaultMessage={translate('overview.project.next_steps.set_up_ci')}
          id="overview.project.next_steps.set_up_ci"
          values={{
            link: tutorialsLink
          }}
        />
      )}

      {showOnlyConfigurePR &&
        (isProjectAdmin ? (
          <FormattedMessage
            defaultMessage={translate('overview.project.next_steps.set_up_pr_deco.admin')}
            id="overview.project.next_steps.set_up_pr_deco.admin"
            values={{
              link_project_settings: projectSettingsLink
            }}
          />
        ) : (
          translate('overview.project.next_steps.set_up_pr_deco')
        ))}

      {showBoth &&
        (isProjectAdmin ? (
          <FormattedMessage
            defaultMessage={translate('overview.project.next_steps.set_up_pr_deco_and_ci.admin')}
            id="overview.project.next_steps.set_up_pr_deco_and_ci.admin"
            values={{
              link_ci: tutorialsLink,
              link_project_settings: projectSettingsLink
            }}
          />
        ) : (
          <FormattedMessage
            defaultMessage={translate('overview.project.next_steps.set_up_pr_deco_and_ci')}
            id="overview.project.next_steps.set_up_pr_deco_and_ci"
            values={{ link_ci: tutorialsLink }}
          />
        ))}
    </DismissableAlert>
  );
}

export default withCurrentUser(FirstAnalysisNextStepsNotif);
