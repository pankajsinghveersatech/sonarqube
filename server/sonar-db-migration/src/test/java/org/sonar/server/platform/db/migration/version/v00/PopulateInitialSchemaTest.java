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
package org.sonar.server.platform.db.migration.version.v00;

import java.sql.SQLException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Stream;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.sonar.api.SonarRuntime;
import org.sonar.api.utils.System2;
import org.sonar.api.utils.Version;
import org.sonar.core.util.UuidFactory;
import org.sonar.core.util.UuidFactoryFast;
import org.sonar.core.util.stream.MoreCollectors;
import org.sonar.db.CoreDbTester;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class PopulateInitialSchemaTest {

  private static final long NOW = 1_500L;

  private final Random random = new Random();
  private final Version version = Version.create(1 + random.nextInt(10), 1 + random.nextInt(10), random.nextInt(10));
  private final UuidFactory uuidFactory = UuidFactoryFast.getInstance();
  private final System2 system2 = mock(System2.class);
  private final SonarRuntime sonarRuntime = mock(SonarRuntime.class);

  @Rule
  public final CoreDbTester db = CoreDbTester.createForSchema(PopulateInitialSchemaTest.class, "v89.sql");

  private final PopulateInitialSchema underTest = new PopulateInitialSchema(db.database(), system2, uuidFactory, sonarRuntime);

  @Before
  public void setUp() {
    when(sonarRuntime.getApiVersion()).thenReturn(version);
  }

  @Test
  public void migration_inserts_users_and_groups() throws SQLException {
    when(system2.now()).thenReturn(NOW);

    underTest.execute();

    verifyAdminUser();
    verifyGroup("sonar-users", "Any new users created will automatically join this group");
    verifyGroup("sonar-administrators", "System administrators");
    String qualityGateUuid = verifyQualityGate();
    verifyInternalProperties();
    verifyProperties(qualityGateUuid);
    verifyRolesOfAdminsGroup();
    verifyRolesOfUsersGroup();
    verifyRolesOfAnyone();
    verifyMembershipOfAdminUser();
  }

  private void verifyAdminUser() {
    Map<String, Object> cols = db.selectFirst("select " +
      "login as \"LOGIN\", " +
      "name as \"NAME\", " +
      "email as \"EMAIL\", " +
      "external_id as \"EXTERNAL_ID\", " +
      "external_login as \"EXTERNAL_LOGIN\", " +
      "external_identity_provider as \"EXT_IDENT_PROVIDER\", " +
      "user_local as \"USER_LOCAL\", " +
      "crypted_password as \"CRYPTED_PASSWORD\", " +
      "salt as \"SALT\", " +
      "hash_method as \"HASH_METHOD\", " +
      "is_root as \"IS_ROOT\", " +
      "onboarded as \"ONBOARDED\", " +
      "created_at as \"CREATED_AT\", " +
      "updated_at as \"UPDATED_AT\", " +
      "reset_password as \"RESET_PASSWORD\" " +
      "from users where login='admin'");

    assertThat(cols)
      .containsEntry("LOGIN", "admin")
      .containsEntry("NAME", "Administrator")
      .containsEntry("EXTERNAL_ID", "admin")
      .containsEntry("EXTERNAL_LOGIN", "admin")
      .containsEntry("EXT_IDENT_PROVIDER", "sonarqube")
      .containsEntry("USER_LOCAL", true)
      .containsEntry("CRYPTED_PASSWORD", "$2a$12$uCkkXmhW5ThVK8mpBvnXOOJRLd64LJeHTeCkSuB3lfaR2N0AYBaSi")
      .containsEntry("HASH_METHOD", "BCRYPT")
      .containsEntry("IS_ROOT", false)
      .containsEntry("ONBOARDED", true)
      .containsEntry("CREATED_AT", NOW)
      .containsEntry("RESET_PASSWORD", true)
      .containsEntry("UPDATED_AT", NOW);

    assertThat(cols.get("EMAIL")).isNull();
    assertThat(cols.get("SALT")).isNull();
  }

  private void verifyGroup(String expectedName, String expectedDescription) {
    List<Map<String, Object>> rows = db.select("select " +
      "uuid as \"UUID\"," +
      "name as \"name\", " +
      "description as \"description\", " +
      "created_at as \"CREATED_AT\", " +
      "updated_at as \"UPDATED_AT\" " +
      "from groups where name='" + expectedName + "'");
    assertThat(rows).hasSize(1);

    Map<String, Object> row = rows.get(0);
    assertThat(row.get("name")).isEqualTo(expectedName);
    assertThat(row.get("description")).isEqualTo(expectedDescription);
    assertThat(((Date) row.get("CREATED_AT")).getTime()).isEqualTo(NOW);
    assertThat(((Date) row.get("UPDATED_AT")).getTime()).isEqualTo(NOW);

  }

  private String verifyQualityGate() {
    List<Map<String, Object>> rows = db.select("select " +
      "uuid as \"UUID\", " +
      "name as \"NAME\", " +
      "is_built_in as \"BUILTIN\"," +
      "created_at as \"CREATED_AT\", " +
      "updated_at as \"UPDATED_AT\"" +
      " from quality_gates");
    assertThat(rows).hasSize(1);

    Map<String, Object> row = rows.get(0);
    assertThat(row.get("NAME")).isEqualTo("Sonar way");
    assertThat(row.get("BUILTIN")).isEqualTo(true);
    assertThat(((Date) row.get("CREATED_AT")).getTime()).isEqualTo(NOW);
    assertThat(((Date) row.get("UPDATED_AT")).getTime()).isEqualTo(NOW);
    return (String) row.get("UUID");
  }

  private void verifyInternalProperties() {
    List<Map<String, Object>> rows = db.select("select " +
      "kee as \"KEE\", " +
      "is_empty as \"EMPTY\", " +
      "text_value as \"VAL\"," +
      "created_at as \"CREATED_AT\" " +
      " from internal_properties");
    assertThat(rows).hasSize(2);

    Map<String, Map<String, Object>> rowsByKey = rows.stream().collect(MoreCollectors.uniqueIndex(t -> (String) t.get("KEE")));
    verifyInternalProperty(rowsByKey, "installation.date", String.valueOf(system2.now()));
    verifyInternalProperty(rowsByKey, "installation.version", version.toString());
  }

  private static void verifyInternalProperty(Map<String, Map<String, Object>> rowsByKey, String key, String val) {
    Map<String, Object> row = rowsByKey.get(key);
    assertThat(row)
      .containsEntry("KEE", key)
      .containsEntry("EMPTY", false)
      .containsEntry("VAL", val)
      .containsEntry("CREATED_AT", NOW);
  }

  private void verifyProperties(String qualityGateUuid) {
    List<Map<String, Object>> rows = db.select("select " +
      "prop_key as \"PROP_KEY\", " +
      "is_empty as \"EMPTY\", " +
      "text_value as \"VAL\"," +
      "created_at as \"CREATED_AT\" " +
      " from properties");
    assertThat(rows).hasSize(3);

    Map<String, Map<String, Object>> rowsByKey = rows.stream().collect(MoreCollectors.uniqueIndex(t -> (String) t.get("PROP_KEY")));
    verifyProperty(rowsByKey, "sonar.forceAuthentication", "true");
    verifyProperty(rowsByKey, "projects.default.visibility", "public");
    verifyProperty(rowsByKey, "qualitygate.default", qualityGateUuid);
  }

  private static void verifyProperty(Map<String, Map<String, Object>> rowsByKey, String key, String val) {
    Map<String, Object> row = rowsByKey.get(key);
    assertThat(row)
      .containsEntry("PROP_KEY", key)
      .containsEntry("EMPTY", false)
      .containsEntry("VAL", val)
      .containsEntry("CREATED_AT", NOW);
  }

  private void verifyRolesOfAdminsGroup() {
    assertThat(selectRoles("sonar-administrators")).containsOnly("admin", "profileadmin", "gateadmin", "provisioning", "applicationcreator", "portfoliocreator");
  }

  private void verifyRolesOfUsersGroup() {
    assertThat(selectRoles("sonar-users")).isEmpty();
  }

  private void verifyRolesOfAnyone() {
    List<Map<String, Object>> rows = db.select("select gr.role as \"role\" " +
      "from group_roles gr where gr.group_uuid is null");
    Stream<String> roles = rows.stream()
      .map(row -> (String) row.get("role"));
    assertThat(roles).containsOnly("provisioning", "scan");
  }

  private Stream<String> selectRoles(String groupName) {
    List<Map<String, Object>> rows = db.select("select gr.role as \"role\" " +
      "from group_roles gr " +
      "inner join groups g on gr.group_uuid = g.uuid " +
      "where g.name='" + groupName + "'");
    return rows.stream()
      .map(row -> (String) row.get("role"));
  }

  private void verifyMembershipOfAdminUser() {
    List<Map<String, Object>> rows = db.select("select g.name as \"groupName\" from groups g " +
      "inner join groups_users gu on gu.group_uuid = g.uuid " +
      "inner join users u on gu.user_uuid = u.uuid " +
      "where u.login='admin'");
    List<String> groupNames = rows.stream()
      .map(row -> (String) row.get("groupName"))
      .collect(MoreCollectors.toArrayList());
    assertThat(groupNames).containsOnly("sonar-administrators", "sonar-users");
  }

}
