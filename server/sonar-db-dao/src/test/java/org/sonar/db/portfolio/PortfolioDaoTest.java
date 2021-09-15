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
package org.sonar.db.portfolio;

import java.util.Set;
import org.junit.Rule;
import org.junit.Test;
import org.sonar.api.impl.utils.AlwaysIncreasingSystem2;
import org.sonar.api.utils.System2;
import org.sonar.core.util.UuidFactoryFast;
import org.sonar.db.DbSession;
import org.sonar.db.DbTester;
import org.sonar.db.audit.AuditPersister;
import org.sonar.db.project.ProjectDto;

import static java.util.Collections.emptySet;
import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

public class PortfolioDaoTest {
  private final System2 system2 = new AlwaysIncreasingSystem2(1L, 1);
  @Rule
  public DbTester db = DbTester.create(system2);
  private final AuditPersister audit = mock(AuditPersister.class);
  private final PortfolioDao portfolioDao = new PortfolioDao(system2, UuidFactoryFast.getInstance(), audit);
  private final DbSession session = db.getSession();

  @Test
  public void selectAllRoots() {
    PortfolioDto p1 = db.components().insertPrivatePortfolioDto("p1");
    PortfolioDto p11 = addPortfolio(p1, "p11");
    PortfolioDto p111 = addPortfolio(p11, "p111");
    PortfolioDto p2 = db.components().insertPrivatePortfolioDto("p2");

    assertThat(portfolioDao.selectAllRoots(session)).extracting("uuid")
      .containsExactlyInAnyOrder("p1", "p2");
  }

  @Test
  public void selectAll() {
    PortfolioDto p1 = db.components().insertPrivatePortfolioDto("p1");
    PortfolioDto p11 = addPortfolio(p1, "p11");
    PortfolioDto p111 = addPortfolio(p11, "p111");
    PortfolioDto p2 = db.components().insertPrivatePortfolioDto("p2");

    assertThat(portfolioDao.selectAll(session)).extracting("uuid")
      .containsExactlyInAnyOrder("p1", "p2", "p11", "p111");
  }

  @Test
  public void selectTree() {
    PortfolioDto p1 = db.components().insertPrivatePortfolioDto("p1");
    PortfolioDto p11 = addPortfolio(p1, "p11");
    PortfolioDto p111 = addPortfolio(p11, "p111");
    PortfolioDto p12 = addPortfolio(p1, "p12");
    PortfolioDto p2 = db.components().insertPrivatePortfolioDto("p2");

    assertThat(portfolioDao.selectTree(session, "p1")).extracting("uuid").containsOnly("p1", "p11", "p111", "p12");
    assertThat(portfolioDao.selectTree(session, "p11")).extracting("uuid").containsOnly("p1", "p11", "p111", "p12");
    assertThat(portfolioDao.selectTree(session, "p111")).extracting("uuid").containsOnly("p1", "p11", "p111", "p12");
    assertThat(portfolioDao.selectTree(session, "p2")).extracting("uuid").containsOnly("p2");
  }

  @Test
  public void selectByKey_returns_empty_if_no_match() {
    assertThat(portfolioDao.selectByKey(session, "nonexisting")).isEmpty();
  }

  @Test
  public void selectByKey_returns_match() {
    PortfolioDto portfolio = db.components().insertPrivatePortfolioDto();
    assertThat(portfolioDao.selectByKey(session, portfolio.getKey())).isNotEmpty();
  }

  @Test
  public void selectByUuid_returns_empty_if_no_match() {
    assertThat(portfolioDao.selectByUuid(session, "nonexisting")).isEmpty();
  }

  @Test
  public void selectByUuid_returns_match() {
    db.components().insertPrivatePortfolioDto("name");
    assertThat(portfolioDao.selectByUuid(session, "name")).isNotEmpty();
    assertThat(portfolioDao.selectByUuid(session, "name").get())
      .extracting("name", "key", "uuid", "description", "rootUuid", "parentUuid", "selectionMode", "selectionExpression")
      .containsExactly("NAME_name", "KEY_name", "name", "DESCRIPTION_name", "name", null, "NONE", null);
  }

  @Test
  public void selectByUuids_returns_empty_if_no_match() {
    db.components().insertPrivatePortfolioDto("name1");
    assertThat(portfolioDao.selectByUuids(session, Set.of("name2"))).isEmpty();
  }

  @Test
  public void selectByUuids_returns_empty_if_uuids_is_empty() {
    db.components().insertPrivatePortfolioDto("name1");
    assertThat(portfolioDao.selectByUuids(session, emptySet())).isEmpty();
  }

  @Test
  public void selectByUuids_returns_matches() {
    db.components().insertPrivatePortfolioDto("name1");
    db.components().insertPrivatePortfolioDto("name2");
    db.components().insertPrivatePortfolioDto("name3");

    assertThat(portfolioDao.selectByUuids(session, Set.of("name1", "name2")))
      .extracting("name", "key", "uuid", "description", "rootUuid", "parentUuid", "selectionMode", "selectionExpression")
      .containsOnly(
        tuple("NAME_name1", "KEY_name1", "name1", "DESCRIPTION_name1", "name1", null, "NONE", null),
        tuple("NAME_name2", "KEY_name2", "name2", "DESCRIPTION_name2", "name2", null, "NONE", null));
  }

  @Test
  public void insert_fails_if_root_is_inconsistent_with_parent() {
    PortfolioDto portfolio = new PortfolioDto()
      .setUuid("uuid")
      .setParentUuid(null)
      .setRootUuid("root");
    assertThatThrownBy(() -> portfolioDao.insert(session, portfolio))
      .isInstanceOf(IllegalArgumentException.class);

    PortfolioDto portfolio2 = new PortfolioDto()
      .setUuid("uuid")
      .setParentUuid("parent")
      .setRootUuid("uuid");
    assertThatThrownBy(() -> portfolioDao.insert(session, portfolio2))
      .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  public void delete() {
    PortfolioDto p1 = db.components().insertPrivatePortfolioDto("p1");
    PortfolioDto p2 = db.components().insertPrivatePortfolioDto("p2");
    PortfolioDto p3 = db.components().insertPrivatePortfolioDto("p3");
    PortfolioDto p4 = db.components().insertPrivatePortfolioDto("p4");

    portfolioDao.addProject(session, "p1", "proj1");
    portfolioDao.addProject(session, "p2", "proj1");

    portfolioDao.addReference(session, "p1", "app1");
    portfolioDao.addReference(session, "p2", "app1");
    portfolioDao.addReference(session, "p4", "p1");

    portfolioDao.delete(session, p1);
    portfolioDao.delete(session, p3);

    assertThat(db.select(session, "select uuid from portfolios")).extracting(m -> m.values().iterator().next())
      .containsOnly("p2", "p4");
    assertThat(db.select(session, "select portfolio_uuid from portfolio_references")).extracting(m -> m.values().iterator().next())
      .containsOnly("p2");
    assertThat(db.select(session, "select portfolio_uuid from portfolio_projects")).extracting(m -> m.values().iterator().next())
      .containsOnly("p2");

    verify(audit, times(2)).deleteComponent(any(), any());
  }

  @Test
  public void deleteAllDescendantPortfolios() {
    PortfolioDto root = db.components().insertPrivatePortfolioDto();
    PortfolioDto child1 = addPortfolio(root);
    PortfolioDto child11 = addPortfolio(child1);
    PortfolioDto root2 = db.components().insertPrivatePortfolioDto();

    portfolioDao.deleteAllDescendantPortfolios(session, root.getUuid());
    portfolioDao.deleteAllDescendantPortfolios(session, root2.getUuid());

    assertThat(db.countSql(session, "select count(*) from portfolios where parent_uuid is not null")).isZero();
  }

  @Test
  public void update_portfolio() {
    db.components().insertPrivatePortfolioDto("name");
    PortfolioDto dto = portfolioDao.selectByUuid(session, "name").get();
    dto.setSelectionMode("newMode");
    dto.setSelectionExpression("newExp");
    dto.setDescription("newDesc");
    dto.setName("newName");
    dto.setRootUuid("root");
    dto.setParentUuid("parent");
    portfolioDao.update(session, dto);

    assertThat(portfolioDao.selectByUuid(session, "name").get())
      .extracting("name", "key", "uuid", "description", "private", "rootUuid", "parentUuid", "selectionMode", "selectionExpression")
      .containsExactly("newName", "KEY_name", "name", "newDesc", true, "root", "parent", "newMode", "newExp");
    verify(audit).updateComponent(any(), any());

  }

  @Test
  public void selectKeysByUuids() {
    PortfolioDto root = db.components().insertPrivatePortfolioDto();
    PortfolioDto child1 = addPortfolio(root);

    assertThat(portfolioDao.selectKeysByUuids(session, Set.of(root.getUuid(), child1.getUuid())))
      .containsOnly(entry(root.getUuid(), root.getKey()), entry(child1.getUuid(), child1.getKey()));
  }

  @Test
  public void selectAllReferencesToPortfolios() {
    db.components().insertPrivatePortfolioDto("portfolio1");
    db.components().insertPrivatePortfolioDto("portfolio2");
    db.components().insertPrivatePortfolioDto("portfolio3");
    ProjectDto app1 = db.components().insertPrivateApplicationDto(p -> p.setDbKey("app1"));

    portfolioDao.addReference(session, "portfolio1", "portfolio2");
    portfolioDao.addReference(session, "portfolio2", "portfolio3");
    portfolioDao.addReference(session, "portfolio3", "app1");

    assertThat(portfolioDao.selectAllReferencesToPortfolios(session))
      .extracting(ReferenceDto::getSourceUuid, ReferenceDto::getTargetUuid)
      .containsOnly(tuple("portfolio1", "portfolio2"), tuple("portfolio2", "portfolio3"));
  }

  @Test
  public void selectAllReferencesToApplications() {
    db.components().insertPrivatePortfolioDto("portfolio1");
    db.components().insertPrivatePortfolioDto("portfolio2");
    db.components().insertPrivatePortfolioDto("portfolio3");
    ProjectDto app1 = db.components().insertPrivateApplicationDto(p -> p.setDbKey("app1"));

    portfolioDao.addReference(session, "portfolio1", "portfolio2");
    portfolioDao.addReference(session, "portfolio2", "portfolio3");
    portfolioDao.addReference(session, "portfolio3", app1.getUuid());

    assertThat(portfolioDao.selectAllReferencesToApplications(session))
      .extracting(ReferenceDto::getSourceUuid, ReferenceDto::getTargetUuid)
      .containsOnly(tuple("portfolio3", app1.getUuid()));
  }

  @Test
  public void add_and_select_references() {
    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isEmpty();
    portfolioDao.addReference(session, "portfolio1", "app1");
    portfolioDao.addReference(session, "portfolio1", "app2");
    portfolioDao.addReference(session, "portfolio2", "app3");
    db.commit();
    assertThat(portfolioDao.selectReferenceUuids(session, "portfolio1")).containsExactlyInAnyOrder("app1", "app2");
    assertThat(portfolioDao.selectReferenceUuids(session, "portfolio2")).containsExactlyInAnyOrder("app3");
    assertThat(portfolioDao.selectReferenceUuids(session, "portfolio3")).isEmpty();

    assertThat(db.countRowsOfTable("portfolio_references")).isEqualTo(3);
    assertThat(db.select(session, "select created_at from portfolio_references"))
      .extracting(m -> m.values().iterator().next())
      .containsExactlyInAnyOrder(1L, 2L, 3L);
  }

  @Test
  public void selectAllReferencesInHierarchy() {
    PortfolioDto root1 = db.components().insertPrivatePortfolioDto("root1");
    PortfolioDto root2 = db.components().insertPrivatePortfolioDto("root2");
    PortfolioDto sub1 = addPortfolio(root1, "sub1");
    PortfolioDto sub11 = addPortfolio(sub1, "sub11");
    ProjectDto app1 = db.components().insertPrivateApplicationDto(p -> p.setUuid("app1"));

    db.components().addPortfolioReference("root1", "app1");
    db.components().addPortfolioReference("root2", "app1");
    db.components().addPortfolioReference("sub11", "root2");

    assertThat(portfolioDao.selectAllReferencesInHierarchy(session, root1.getUuid()))
      .extracting(ReferenceDto::getSourceUuid, ReferenceDto::getTargetUuid)
      .containsOnly(
        tuple(root1.getUuid(), app1.getUuid()),
        tuple(sub11.getUuid(), root2.getUuid()));
  }

  @Test
  public void selectReferencers() {
    PortfolioDto portfolio1 = db.components().insertPrivatePortfolioDto("portfolio1");
    PortfolioDto portfolio2 = db.components().insertPrivatePortfolioDto("portfolio2");

    ProjectDto app1 = db.components().insertPrivateApplicationDto(c -> c.setUuid("app1"));
    portfolioDao.addReference(session, "portfolio1", "portfolio2");
    portfolioDao.addReference(session, "portfolio1", app1.getUuid());
    portfolioDao.addReference(session, "portfolio2", app1.getUuid());

    assertThat(portfolioDao.selectReferencers(session, portfolio2.getUuid()))
      .extracting("uuid").containsOnly("portfolio1");

    assertThat(portfolioDao.selectReferencers(session, "app1"))
      .extracting("uuid").containsOnly("portfolio1", "portfolio2");
  }

  @Test
  public void selectReferencers_for_non_existing_reference() {
    assertThat(portfolioDao.selectReferencers(session, "unknown")).isEmpty();
  }

  @Test
  public void selectRootOfReferencers_returns_root() {
    PortfolioDto portfolio1 = db.components().insertPrivatePortfolioDto("name1");
    PortfolioDto sub = addPortfolio(portfolio1, "sub1");
    PortfolioDto portfolio2 = db.components().insertPrivatePortfolioDto("name2");
    db.components().addPortfolioReference(sub, portfolio2.getUuid());

    assertThat(portfolioDao.selectRootOfReferencers(session, portfolio2.getUuid()))
      .extracting("uuid")
      .containsOnly(portfolio1.getUuid());
  }

  @Test
  public void selectRootOfReferencers_for_non_existing_reference() {
    assertThat(portfolioDao.selectRootOfReferencers(session, "nonexisting")).isEmpty();
  }

  @Test
  public void deleteReferencesTo() {
    db.components().insertPrivatePortfolioDto("portfolio1");
    db.components().insertPrivatePortfolioDto("portfolio2");
    db.components().insertPrivatePortfolioDto("portfolio3");

    db.components().addPortfolioReference("portfolio1", "portfolio3");
    db.components().addPortfolioReference("portfolio2", "portfolio3");
    portfolioDao.deleteReferencesTo(session, "portfolio3");
    session.commit();
    assertThat(db.countRowsOfTable("portfolio_references")).isZero();
  }

  @Test
  public void deleteReferencesTo_with_non_existing_reference_doesnt_fail() {
    portfolioDao.deleteReferencesTo(session, "portfolio3");
  }

  @Test
  public void deleteAllReferences() {
    PortfolioDto root = db.components().insertPrivatePortfolioDto();
    PortfolioDto child1 = addPortfolio(root);
    PortfolioDto child11 = addPortfolio(child1);
    PortfolioDto root2 = db.components().insertPrivatePortfolioDto();
    PortfolioDto root3 = db.components().insertPrivatePortfolioDto();
    PortfolioDto root4 = db.components().insertPrivatePortfolioDto();

    db.components().addPortfolioReference(child1.getUuid(), root2.getUuid());
    db.components().addPortfolioReference(root3.getUuid(), root4.getUuid());
    assertThat(db.countRowsOfTable("portfolio_references")).isEqualTo(2);

    portfolioDao.deleteAllReferences(session);
    session.commit();
    assertThat(db.countRowsOfTable("portfolio_references")).isZero();
  }

  @Test
  public void deleteReference() {
    db.components().insertPrivatePortfolioDto("portfolio1");
    db.components().insertPrivatePortfolioDto("portfolio2");
    db.components().insertPrivatePortfolioDto("portfolio3");

    db.components().addPortfolioReference("portfolio1", "portfolio3");
    db.components().addPortfolioReference("portfolio2", "portfolio3");
    portfolioDao.deleteReference(session, "portfolio1", "portfolio3");
    assertThat(portfolioDao.selectAllReferencesToPortfolios(session))
      .extracting(ReferenceDto::getSourceUuid, ReferenceDto::getTargetUuid)
      .containsOnly(tuple("portfolio2", "portfolio3"));
  }

  @Test
  public void insert_and_select_projects() {
    db.components().insertPrivateProject("project1");
    db.components().insertPrivateProject("project2");

    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isEmpty();
    portfolioDao.addProject(session, "portfolio1", "project1");
    portfolioDao.addProject(session, "portfolio1", "project2");
    portfolioDao.addProject(session, "portfolio2", "project2");
    db.commit();
    assertThat(portfolioDao.selectProjects(session, "portfolio1")).extracting(ProjectDto::getUuid).containsOnly("project1", "project2");
    assertThat(portfolioDao.selectProjects(session, "portfolio2")).extracting(ProjectDto::getUuid).containsOnly("project2");
    assertThat(portfolioDao.selectProjects(session, "portfolio3")).isEmpty();

    assertThat(db.countRowsOfTable("portfolio_projects")).isEqualTo(3);
    assertThat(db.select(session, "select created_at from portfolio_projects"))
      .extracting(m -> m.values().iterator().next())
      .containsOnly(3L, 4L, 5L);
  }

  @Test
  public void delete_projects() {
    db.components().insertPrivateProject("project1");
    db.components().insertPrivateProject("project2");

    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isEmpty();
    portfolioDao.addProject(session, "portfolio1", "project1");
    portfolioDao.addProject(session, "portfolio1", "project2");
    portfolioDao.addProject(session, "portfolio2", "project2");
    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isNotEmpty();

    portfolioDao.deleteProjects(session, "portfolio1");
    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isEmpty();
    assertThat(portfolioDao.selectProjects(session, "portfolio2")).extracting(ProjectDto::getUuid).containsOnly("project2");
  }

  @Test
  public void delete_project() {
    db.components().insertPrivateProject("project1");
    db.components().insertPrivateProject("project2");

    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isEmpty();
    portfolioDao.addProject(session, "portfolio1", "project1");
    portfolioDao.addProject(session, "portfolio1", "project2");
    portfolioDao.addProject(session, "portfolio2", "project2");
    assertThat(portfolioDao.selectProjects(session, "portfolio1")).isNotEmpty();

    portfolioDao.deleteProject(session, "portfolio1", "project2");
    assertThat(portfolioDao.selectProjects(session, "portfolio1")).extracting(ProjectDto::getUuid).containsOnly("project1");
    assertThat(portfolioDao.selectProjects(session, "portfolio2")).extracting(ProjectDto::getUuid).containsOnly("project2");
  }

  @Test
  public void selectAllProjectsInHierarchy() {
    db.components().insertPrivateProject("p1");
    db.components().insertPrivateProject("p2");
    db.components().insertPrivateProject("p3");
    db.components().insertPrivateProject("p4");

    PortfolioDto root = db.components().insertPrivatePortfolioDto("root");
    PortfolioDto child1 = addPortfolio(root, "child1");
    PortfolioDto child11 = addPortfolio(child1, "child11");
    PortfolioDto root2 = db.components().insertPrivatePortfolioDto("root2");

    portfolioDao.addProject(session, root.getUuid(), "p1");
    portfolioDao.addProject(session, child1.getUuid(), "p2");
    portfolioDao.addProject(session, child11.getUuid(), "p3");
    portfolioDao.addProject(session, root2.getUuid(), "p4");
    session.commit();

    assertThat(portfolioDao.selectAllProjectsInHierarchy(session, root.getUuid()))
      .extracting(PortfolioProjectDto::getProjectUuid).containsExactly("p1", "p2", "p3");
    assertThat(portfolioDao.selectAllProjectsInHierarchy(session, "nonexisting")).isEmpty();
  }

  @Test
  public void deleteAllProjects() {
    db.components().insertPrivateProjectDto("p1");
    db.components().insertPrivateProject("p2");
    db.components().insertPrivateProject("p3");
    db.components().insertPrivateProject("p4");

    PortfolioDto root = db.components().insertPrivatePortfolioDto();
    PortfolioDto child1 = addPortfolio(root);
    PortfolioDto child11 = addPortfolio(child1);
    PortfolioDto root2 = db.components().insertPrivatePortfolioDto();

    portfolioDao.addProject(session, root.getUuid(), "p1");
    portfolioDao.addProject(session, child1.getUuid(), "p2");
    portfolioDao.addProject(session, child11.getUuid(), "p3");
    portfolioDao.addProject(session, root2.getUuid(), "p4");
    assertThat(db.countRowsOfTable(session, "portfolio_projects")).isEqualTo(4);

    portfolioDao.deleteAllProjects(session);
    assertThat(db.countRowsOfTable(session, "portfolio_projects")).isZero();
  }

  private PortfolioDto addPortfolio(PortfolioDto parent) {
    return addPortfolio(parent, UuidFactoryFast.getInstance().create());
  }

  private PortfolioDto addPortfolio(PortfolioDto parent, String uuid) {
    PortfolioDto portfolio = new PortfolioDto()
      .setKey("key_" + uuid)
      .setName("name_" + uuid)
      .setSelectionMode(PortfolioDto.SelectionMode.NONE)
      .setRootUuid(parent.getRootUuid())
      .setParentUuid(parent.getUuid())
      .setUuid(uuid);
    db.getDbClient().portfolioDao().insert(session, portfolio);
    session.commit();
    return portfolio;
  }
}
