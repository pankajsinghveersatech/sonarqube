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

export default function othersExample(branchesEnabled: boolean) {
  return `image: maven:3.3.9

clone:
  depth: full

pipelines:
  branches:
    '{master}': # or the name of your main branch
      - step:
          name: SonarQube analysis
          script:
            - pipe: sonarsource/sonarqube-scan:1.0.0
              variables:
                SONAR_HOST_URL: \${SONAR_HOST_URL} # Get the value from the repository/workspace variable.
                SONAR_TOKEN: \${SONAR_TOKEN} # Get the value from the repository/workspace variable. You shouldn't set secret in clear text here.
${
  branchesEnabled
    ? `
  pull-requests:
    '**':
      - step:
          name: SonarQube analysis
          script:
            - pipe: sonarsource/sonarqube-scan:1.0.0
              variables:
                SONAR_HOST_URL: \${SONAR_HOST_URL} # Get the value from the repository/workspace variable.
                SONAR_TOKEN: \${SONAR_TOKEN} # Get the value from the repository/workspace variable. You shouldn't set secret in clear text here.
`
    : ''
}  
definitions:
  caches:
    sonar: ~/.sonar`;
}
