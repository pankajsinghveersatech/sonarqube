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
import { ButtonLink } from '../../../../components/controls/buttons';
import { Alert } from '../../../../components/ui/Alert';
import MandatoryFieldMarker from '../../../../components/ui/MandatoryFieldMarker';
import { translate } from '../../../../helpers/l10n';
import { AlmBindingDefinitionBase } from '../../../../types/alm-settings';
import '../../styles.css';

export interface AlmBindingDefinitionFormFieldProps<B extends AlmBindingDefinitionBase> {
  autoFocus?: boolean;
  help?: React.ReactNode;
  id: string;
  isTextArea?: boolean;
  maxLength?: number;
  onFieldChange: (id: keyof B, value: string) => void;
  optional?: boolean;
  overwriteOnly?: boolean;
  propKey: keyof B;
  value: string;
  isSecret?: boolean;
}

export function AlmBindingDefinitionFormField<B extends AlmBindingDefinitionBase>(
  props: AlmBindingDefinitionFormFieldProps<B>
) {
  const {
    autoFocus,
    help,
    id,
    isTextArea,
    maxLength,
    optional,
    overwriteOnly = false,
    propKey,
    value,
    isSecret
  } = props;
  const [showField, setShowField] = React.useState(!overwriteOnly);

  return (
    <div className="settings-definition">
      <div className="settings-definition-left">
        <label className="h3" htmlFor={id}>
          {translate('settings.almintegration.form', id)}
        </label>
        {!optional && <MandatoryFieldMarker />}
        {help && <div className="markdown small spacer-top">{help}</div>}
      </div>
      <div className="settings-definition-right big-padded-top display-flex-column">
        {!showField && overwriteOnly && (
          <div>
            <p>{translate('settings.almintegration.form.secret.field')}</p>
            <ButtonLink
              onClick={() => {
                props.onFieldChange(propKey, '');
                setShowField(true);
              }}>
              {translate('settings.almintegration.form.secret.update_field')}
            </ButtonLink>
          </div>
        )}

        {showField && isTextArea && (
          <textarea
            className="width-100"
            id={id}
            maxLength={maxLength || 2000}
            onChange={e => props.onFieldChange(propKey, e.currentTarget.value)}
            required={!optional}
            rows={5}
            value={value}
          />
        )}

        {showField && !isTextArea && (
          <input
            className="width-100"
            autoFocus={autoFocus}
            id={id}
            maxLength={maxLength || 100}
            name={id}
            onChange={e => props.onFieldChange(propKey, e.currentTarget.value)}
            size={50}
            type="text"
            value={value}
          />
        )}

        {showField && isSecret && (
          <Alert variant="info" className="spacer-top">
            <FormattedMessage
              id="settings.almintegration.form.secret.can_encrypt"
              defaultMessage={translate('settings.almintegration.form.secret.can_encrypt')}
              values={{
                learn_more: (
                  <Link
                    target="_blank"
                    to={{
                      pathname:
                        '/documentation/instance-administration/security/#settings-encryption'
                    }}>
                    {translate('learn_more')}
                  </Link>
                )
              }}
            />
          </Alert>
        )}
      </div>
    </div>
  );
}
