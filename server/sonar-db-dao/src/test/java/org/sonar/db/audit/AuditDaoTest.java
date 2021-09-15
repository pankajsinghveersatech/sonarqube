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
package org.sonar.db.audit;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.Rule;
import org.junit.Test;
import org.sonar.api.impl.utils.TestSystem2;
import org.sonar.core.util.UuidFactoryImpl;
import org.sonar.db.DbSession;
import org.sonar.db.DbTester;

import static org.apache.commons.lang.RandomStringUtils.randomAlphanumeric;
import static org.assertj.core.api.Assertions.assertThat;
import static org.sonar.db.audit.AuditDao.EXCEEDED_LENGTH;

public class AuditDaoTest {

  private static final long NOW = 1000000L;
  private final TestSystem2 system2 = new TestSystem2().setNow(NOW);
  @Rule
  public final DbTester db = DbTester.create(system2);
  private final DbSession dbSession = db.getSession();

  private final AuditDao testAuditDao = new AuditDao(system2, UuidFactoryImpl.INSTANCE);

  @Test
  public void selectByPeriodPaginated_10001EntriesInserted_defaultPageSizeEntriesReturned() {
    prepareRowsWithDeterministicCreatedAt(10001);

    List<AuditDto> auditDtos = testAuditDao.selectByPeriodPaginated(dbSession, 1, 20000, 1);

    assertThat(auditDtos.size()).isEqualTo(10000);
  }

  @Test
  public void selectByPeriodPaginated_10001EntriesInserted_querySecondPageReturns1Item() {
    prepareRowsWithDeterministicCreatedAt(10001);

    List<AuditDto> auditDtos = testAuditDao.selectByPeriodPaginated(dbSession, 1, 20000, 2);

    assertThat(auditDtos.size()).isEqualTo(1);
  }

  @Test
  public void deleteIfBeforeSelectedDate_deleteTwoRows() {
    prepareRowsWithDeterministicCreatedAt(3);

    Set<String> auditUuids = testAuditDao.selectOlderThan(dbSession, 3)
      .stream()
      .map(AuditDto::getUuid)
      .collect(Collectors.toSet());

    testAuditDao.deleteByUuids(dbSession, auditUuids);

    List<AuditDto> auditDtos = testAuditDao.selectByPeriodPaginated(dbSession, 1, 4, 1);
    assertThat(auditDtos.size()).isEqualTo(1);
  }

  @Test
  public void selectByPeriodPaginated_100EntriesInserted_100EntriesReturned() {
    prepareRowsWithDeterministicCreatedAt(100);

    List<AuditDto> auditDtos = testAuditDao.selectByPeriodPaginated(dbSession, 1, 101, 1);

    assertThat(auditDtos.size()).isEqualTo(100);
  }

  @Test
  public void insert_doNotSetACreatedAtIfAlreadySet() {
    AuditDto auditDto = AuditTesting.newAuditDto();
    auditDto.setCreatedAt(1041375600000L);

    testAuditDao.insert(dbSession, auditDto);

    List<AuditDto> auditDtos = testAuditDao.selectByPeriodPaginated(dbSession, 1041375500000L, 1041375700000L, 1);
    AuditDto storedAuditDto = auditDtos.get(0);
    assertThat(storedAuditDto.getCreatedAt()).isEqualTo(auditDto.getCreatedAt());
  }

  @Test
  public void insert_setACreatedAtIfAlreadySet() {
    AuditDto auditDto = AuditTesting.newAuditDto();
    auditDto.setCreatedAt(0);

    testAuditDao.insert(dbSession, auditDto);

    assertThat(auditDto.getCreatedAt()).isNotZero();
  }

  @Test
  public void insert_doNotSetAUUIDIfAlreadySet() {
    AuditDto auditDto = AuditTesting.newAuditDto();
    auditDto.setUuid("myuuid");
    auditDto.setCreatedAt(1041375600000L);

    testAuditDao.insert(dbSession, auditDto);

    List<AuditDto> auditDtos = testAuditDao.selectByPeriodPaginated(dbSession, 1041375500000L, 1041375700000L, 1);
    AuditDto storedAuditDto = auditDtos.get(0);
    assertThat(storedAuditDto.getUuid()).isEqualTo(auditDto.getUuid());
  }

  @Test
  public void insert_truncateVeryLongNewValue() {
    AuditDto auditDto = AuditTesting.newAuditDto();
    String veryLongString = randomAlphanumeric(5000);
    auditDto.setNewValue(veryLongString);

    testAuditDao.insert(dbSession, auditDto);

    assertThat(auditDto.getNewValue()).isEqualTo(EXCEEDED_LENGTH);
  }

  private void prepareRowsWithDeterministicCreatedAt(int size) {
    for (int i = 1; i <= size; i++) {
      AuditDto auditDto = AuditTesting.newAuditDto(i);
      testAuditDao.insert(dbSession, auditDto);
    }
  }
}
