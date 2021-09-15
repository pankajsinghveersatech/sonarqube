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
package org.sonar.server.platform.db.migration.version.v91;

import java.sql.SQLException;
import org.sonar.db.Database;
import org.sonar.db.DatabaseUtils;
import org.sonar.server.platform.db.migration.step.DataChange;

abstract class DropCustomMetricsData extends DataChange {

  DropCustomMetricsData(Database db) {
    super(db);
  }

  @Override
  protected void execute(Context context) throws SQLException {
    if (!checkIfUserManagedColumnExists()) {
      return;
    }

    var massUpdate = context.prepareMassUpdate();
    massUpdate.select(selectQuery()).setBoolean(1, true);
    massUpdate.update(updateQuery());

    massUpdate.execute((row, update) -> {
      update.setString(1, row.getString(1));
      return true;
    });
  }

  private boolean checkIfUserManagedColumnExists() throws SQLException {
    try (var connection = getDatabase().getDataSource().getConnection()) {
      if (DatabaseUtils.tableColumnExists(connection, "metrics", "user_managed")) {
        return true;
      }
    }
    return false;
  }

  abstract String selectQuery();

  abstract String updateQuery();
}
