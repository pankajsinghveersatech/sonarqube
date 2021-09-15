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
import { endOfDay, startOfDay, subDays } from 'date-fns';
import * as React from 'react';
import { translate } from '../../../helpers/l10n';
import { getBaseUrl } from '../../../helpers/system';
import '../style.css';
import { now, RangeOption } from '../utils';

export interface DownloadButtonProps {
  dateRange?: { from?: Date; to?: Date };
  downloadStarted: boolean;
  onStartDownload: () => void;
  selection: RangeOption;
}

const RANGE_OPTION_START = {
  [RangeOption.Today]: () => now(),
  [RangeOption.Week]: () => subDays(now(), 7),
  [RangeOption.Month]: () => subDays(now(), 30),
  [RangeOption.Trimester]: () => subDays(now(), 90)
};

const toISODateString = (date: Date) => date.toISOString();

function getRangeParams(selection: RangeOption, dateRange?: { from?: Date; to?: Date }) {
  if (selection === RangeOption.Custom) {
    // dateRange should be complete if 'custom' is selected
    if (!(dateRange?.to && dateRange?.from)) {
      return '';
    }

    return new URLSearchParams({
      from: toISODateString(startOfDay(dateRange.from)),
      to: toISODateString(endOfDay(dateRange.to))
    }).toString();
  }

  return new URLSearchParams({
    from: toISODateString(startOfDay(RANGE_OPTION_START[selection]())),
    to: toISODateString(now())
  }).toString();
}

export default function DownloadButton(props: DownloadButtonProps) {
  const { dateRange, downloadStarted, selection } = props;

  const downloadDisabled =
    downloadStarted ||
    (selection === RangeOption.Custom &&
      (dateRange?.from === undefined || dateRange?.to === undefined));

  const downloadUrl = downloadDisabled
    ? '#'
    : `${getBaseUrl()}/api/audit_logs/download?${getRangeParams(selection, dateRange)}`;

  return (
    <>
      <a
        className={classNames('button button-primary', { disabled: downloadDisabled })}
        download="audit_logs.json"
        onClick={downloadDisabled ? undefined : props.onStartDownload}
        href={downloadUrl}
        rel="noopener noreferrer"
        target="_blank">
        {translate('download_verb')}
      </a>

      {downloadStarted && (
        <div className="spacer-top">
          <p>{translate('audit_logs.download_start.sentence.1')}</p>
          <p>{translate('audit_logs.download_start.sentence.2')}</p>
          <br />
          <p>{translate('audit_logs.download_start.sentence.3')}</p>
        </div>
      )}
    </>
  );
}
