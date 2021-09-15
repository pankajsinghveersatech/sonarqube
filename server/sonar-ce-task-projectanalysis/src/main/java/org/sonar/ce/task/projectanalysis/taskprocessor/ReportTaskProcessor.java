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
package org.sonar.ce.task.projectanalysis.taskprocessor;

import java.util.Collections;
import java.util.Set;
import javax.annotation.CheckForNull;
import org.sonar.ce.task.CeTask;
import org.sonar.ce.task.CeTaskResult;
import org.sonar.ce.task.container.TaskContainer;
import org.sonar.ce.task.projectanalysis.container.ContainerFactory;
import org.sonar.ce.task.step.ComputationStepExecutor;
import org.sonar.ce.task.taskprocessor.CeTaskProcessor;
import org.sonar.ce.task.taskprocessor.TaskResultHolder;
import org.sonar.core.platform.ComponentContainer;
import org.sonar.db.ce.CeTaskTypes;
import org.sonar.ce.task.projectanalysis.container.ReportAnalysisComponentProvider;

public class ReportTaskProcessor implements CeTaskProcessor {

  private static final Set<String> HANDLED_TYPES = Collections.singleton(CeTaskTypes.REPORT);

  private final ContainerFactory containerFactory;
  private final ComponentContainer serverContainer;
  @CheckForNull
  private final ReportAnalysisComponentProvider[] componentProviders;

  /**
   * Used when at least one Privileged plugin is installed
   */
  public ReportTaskProcessor(ContainerFactory containerFactory, ComponentContainer serverContainer, ReportAnalysisComponentProvider[] componentProviders) {
    this.containerFactory = containerFactory;
    this.serverContainer = serverContainer;
    this.componentProviders = componentProviders;
  }

  /**
   * Used when no privileged plugin is installed
   */
  public ReportTaskProcessor(ContainerFactory containerFactory, ComponentContainer serverContainer) {
    this.containerFactory = containerFactory;
    this.serverContainer = serverContainer;
    this.componentProviders = null;
  }

  /**
   * Used when loaded in WebServer where none of the dependencies are available and where only
   * {@link #getHandledCeTaskTypes()} will be called.
   */
  public ReportTaskProcessor() {
    this(null, null, null);
  }

  @Override
  public Set<String> getHandledCeTaskTypes() {
    return HANDLED_TYPES;
  }

  @Override
  public CeTaskResult process(CeTask task) {
    try (TaskContainer ceContainer = containerFactory.create(serverContainer, task, componentProviders)) {
      ceContainer.bootup();

      ceContainer.getComponentByType(ComputationStepExecutor.class).execute();
      return ceContainer.getComponentByType(TaskResultHolder.class).getResult();
    }
  }
}
