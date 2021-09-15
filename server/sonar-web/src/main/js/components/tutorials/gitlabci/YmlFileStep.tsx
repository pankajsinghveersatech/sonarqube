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
import { ClipboardIconButton } from '../../../components/controls/clipboard';
import { translate } from '../../../helpers/l10n';
import { withAppState } from '../../hoc/withAppState';
import FinishButton from '../components/FinishButton';
import Step from '../components/Step';
import { BuildTools } from '../types';
import PipeCommand from './commands/PipeCommand';

export interface YmlFileStepProps {
  appState: T.AppState;
  buildTool?: BuildTools;
  finished: boolean;
  onDone: () => void;
  onOpen: () => void;
  open: boolean;
  projectKey: string;
}

export function YmlFileStep(props: YmlFileStepProps) {
  const {
    appState: { branchesEnabled },
    buildTool,
    open,
    finished,
    projectKey
  } = props;

  const renderForm = () => (
    <div className="boxed-group-inner">
      <div className="flex-columns">
        <div className="flex-column-full">
          {buildTool && (
            <>
              <div className="big-spacer-bottom">
                <FormattedMessage
                  defaultMessage={translate('onboarding.tutorial.with.gitlab_ci.yml.description')}
                  id="onboarding.tutorial.with.gitlab_ci.yml.description"
                  values={{
                    filename: (
                      <>
                        <code className="rule">
                          {translate('onboarding.tutorial.with.gitlab_ci.yml.filename')}
                        </code>
                        <ClipboardIconButton
                          className="little-spacer-left"
                          copyValue={translate('onboarding.tutorial.with.gitlab_ci.yml.filename')}
                        />
                      </>
                    )
                  }}
                />
              </div>

              <div className="big-spacer-bottom abs-width-600">
                <PipeCommand
                  buildTool={buildTool}
                  branchesEnabled={branchesEnabled}
                  projectKey={projectKey}
                />
              </div>

              <p className="little-spacer-bottom">
                {branchesEnabled
                  ? translate('onboarding.tutorial.with.gitlab_ci.yml.baseconfig')
                  : translate('onboarding.tutorial.with.gitlab_ci.yml.baseconfig.no_branches')}
              </p>

              <p>{translate('onboarding.tutorial.with.gitlab_ci.yml.existing')}</p>
            </>
          )}
        </div>
      </div>
      <FinishButton onClick={props.onDone} />
    </div>
  );

  return (
    <Step
      finished={finished}
      onOpen={props.onOpen}
      open={open}
      renderForm={renderForm}
      stepNumber={3}
      stepTitle={translate('onboarding.tutorial.with.gitlab_ci.yml.title')}
    />
  );
}

export default withAppState(YmlFileStep);
