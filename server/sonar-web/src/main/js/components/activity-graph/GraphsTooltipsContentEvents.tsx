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
import EventInner from '../../apps/projectActivity/components/EventInner';

interface Props {
  addSeparator: boolean;
  events: T.AnalysisEvent[];
}

export default function GraphsTooltipsContentEvents({ addSeparator, events }: Props) {
  return (
    <tbody>
      {addSeparator && (
        <tr>
          <td className="activity-graph-tooltip-separator" colSpan={3}>
            <hr />
          </td>
        </tr>
      )}
      <tr className="activity-graph-tooltip-line">
        <td colSpan={3}>
          {events.map(event => (
            <div className="little-spacer-bottom" key={event.key}>
              <EventInner event={event} readonly={true} />
            </div>
          ))}
        </td>
      </tr>
      {addSeparator && (
        <tr>
          <td className="activity-graph-tooltip-separator" colSpan={3}>
            <hr />
          </td>
        </tr>
      )}
    </tbody>
  );
}
