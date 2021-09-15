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

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.sonar.api.resources.Qualifiers;
import org.sonar.api.utils.System2;
import org.sonar.core.util.UuidFactory;
import org.sonar.db.Dao;
import org.sonar.db.DbSession;
import org.sonar.db.audit.AuditPersister;
import org.sonar.db.audit.model.ComponentNewValue;
import org.sonar.db.project.ProjectDto;

import static com.google.common.base.Preconditions.checkArgument;
import static java.util.Collections.emptyList;
import static java.util.Collections.singleton;
import static org.sonar.db.DatabaseUtils.executeLargeInputs;

public class PortfolioDao implements Dao {
  private final System2 system2;
  private final UuidFactory uuidFactory;
  private final AuditPersister auditPersister;

  public PortfolioDao(System2 system2, UuidFactory uuidFactory, AuditPersister auditPersister) {
    this.system2 = system2;
    this.uuidFactory = uuidFactory;
    this.auditPersister = auditPersister;
  }

  public List<PortfolioDto> selectAllRoots(DbSession dbSession) {
    return mapper(dbSession).selectAllRoots();
  }

  public List<PortfolioDto> selectAll(DbSession dbSession) {
    return mapper(dbSession).selectAll();
  }

  public List<PortfolioDto> selectTree(DbSession dbSession, String portfolioUuid) {
    return mapper(dbSession).selectTree(portfolioUuid);
  }

  public Optional<PortfolioDto> selectByKey(DbSession dbSession, String key) {
    return Optional.ofNullable(mapper(dbSession).selectByKey(key));
  }

  public List<PortfolioDto> selectByKeys(DbSession dbSession, Set<String> portfolioDbKeys) {
    return executeLargeInputs(portfolioDbKeys, input -> mapper(dbSession).selectByKeys(input));
  }

  public Optional<PortfolioDto> selectByUuid(DbSession dbSession, String uuid) {
    return Optional.ofNullable(mapper(dbSession).selectByUuid(uuid));
  }

  public List<PortfolioDto> selectByUuids(DbSession dbSession, Set<String> uuids) {
    if (uuids.isEmpty()) {
      return emptyList();
    }
    return mapper(dbSession).selectByUuids(uuids);
  }

  public void insert(DbSession dbSession, PortfolioDto portfolio) {
    checkArgument(portfolio.isRoot() == (portfolio.getUuid().equals(portfolio.getRootUuid())));
    mapper(dbSession).insert(portfolio);
    auditPersister.addComponent(dbSession, toComponentNewValue(portfolio));
  }

  public void delete(DbSession dbSession, PortfolioDto portfolio) {
    mapper(dbSession).deletePortfoliosByUuids(singleton(portfolio.getUuid()));
    mapper(dbSession).deleteReferencesByPortfolioOrReferenceUuids(singleton(portfolio.getUuid()));
    mapper(dbSession).deleteProjectsByPortfolioUuids(singleton(portfolio.getUuid()));
    auditPersister.deleteComponent(dbSession, toComponentNewValue(portfolio));
  }

  public void deleteAllDescendantPortfolios(DbSession dbSession, String rootUuid) {
    // not audited but it's part of DefineWs
    mapper(dbSession).deleteAllDescendantPortfolios(rootUuid);
  }

  public void update(DbSession dbSession, PortfolioDto portfolio) {
    checkArgument(portfolio.isRoot() == (portfolio.getUuid().equals(portfolio.getRootUuid())));
    portfolio.setUpdatedAt(system2.now());
    mapper(dbSession).update(portfolio);
    auditPersister.updateComponent(dbSession, toComponentNewValue(portfolio));
  }

  private static ComponentNewValue toComponentNewValue(PortfolioDto portfolio) {
    return new ComponentNewValue(portfolio.getUuid(), portfolio.getName(), portfolio.getKey(), portfolio.isPrivate(),
      portfolio.getDescription(), qualifier(portfolio));
  }

  private static String qualifier(PortfolioDto portfolioDto) {
    return portfolioDto.isRoot() ? Qualifiers.VIEW : Qualifiers.SUBVIEW;
  }

  public Map<String, String> selectKeysByUuids(DbSession dbSession, Collection<String> uuids) {
    return executeLargeInputs(uuids, uuids1 -> mapper(dbSession).selectByUuids(uuids1)).stream()
      .collect(Collectors.toMap(PortfolioDto::getUuid, PortfolioDto::getKey));
  }

  public void addReference(DbSession dbSession, String portfolioUuid, String referenceUuid) {
    mapper(dbSession).insertReference(new PortfolioReferenceDto()
      .setUuid(uuidFactory.create())
      .setPortfolioUuid(portfolioUuid)
      .setReferenceUuid(referenceUuid)
      .setCreatedAt(system2.now()));
  }

  public List<ReferenceDto> selectAllReferencesToPortfolios(DbSession dbSession) {
    return mapper(dbSession).selectAllReferencesToPortfolios();
  }

  public List<ReferenceDto> selectAllReferencesToApplications(DbSession dbSession) {
    return mapper(dbSession).selectAllReferencesToApplications();
  }

  public Set<String> selectReferenceUuids(DbSession dbSession, String portfolioUuid) {
    return mapper(dbSession).selectReferenceUuids(portfolioUuid);
  }

  public List<ReferenceDto> selectAllReferencesInHierarchy(DbSession dbSession, String uuid) {
    return mapper(dbSession).selectAllReferencesInHierarchy(uuid);
  }

  public List<PortfolioDto> selectReferencers(DbSession dbSession, String referenceUuid) {
    return mapper(dbSession).selectReferencers(referenceUuid);
  }

  public List<PortfolioDto> selectRootOfReferencers(DbSession dbSession, String referenceUuid) {
    return mapper(dbSession).selectRootOfReferencers(referenceUuid);
  }

  public void deleteReferencesTo(DbSession dbSession, String referenceUuid) {
    mapper(dbSession).deleteReferencesTo(referenceUuid);
  }

  public void deleteAllReferences(DbSession dbSession) {
    mapper(dbSession).deleteAllReferences();
  }

  public int deleteReference(DbSession dbSession, String portfolioUuid, String referenceUuid) {
    return mapper(dbSession).deleteReference(portfolioUuid, referenceUuid);
  }

  public ReferenceDetailsDto selectReference(DbSession dbSession, String portfolioUuid, String referenceKey) {
    return mapper(dbSession).selectReference(portfolioUuid, referenceKey);
  }

  public List<ProjectDto> selectProjects(DbSession dbSession, String portfolioUuid) {
    return mapper(dbSession).selectProjects(portfolioUuid);
  }

  public List<PortfolioProjectDto> selectAllProjectsInHierarchy(DbSession dbSession, String rootUuid) {
    return mapper(dbSession).selectAllProjectsInHierarchy(rootUuid);
  }

  public List<PortfolioProjectDto> selectAllPortfolioProjects(DbSession dbSession) {
    return mapper(dbSession).selectAllPortfolioProjects();
  }

  public void addProject(DbSession dbSession, String portfolioUuid, String projectUuid) {
    mapper(dbSession).insertProject(new PortfolioProjectDto()
      .setUuid(uuidFactory.create())
      .setPortfolioUuid(portfolioUuid)
      .setProjectUuid(projectUuid)
      .setCreatedAt(system2.now()));
  }

  public void deleteProjects(DbSession dbSession, String portfolioUuid) {
    mapper(dbSession).deleteProjects(portfolioUuid);
  }

  public void deleteProject(DbSession dbSession, String portfolioUuid, String projectUuid) {
    mapper(dbSession).deleteProject(portfolioUuid, projectUuid);
  }

  public void deleteAllProjects(DbSession dbSession) {
    mapper(dbSession).deleteAllProjects();
  }

  private static PortfolioMapper mapper(DbSession session) {
    return session.getMapper(PortfolioMapper.class);
  }

}
