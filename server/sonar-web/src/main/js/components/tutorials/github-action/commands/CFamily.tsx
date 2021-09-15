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
import { translate } from '../../../../helpers/l10n';
import { CompilationInfo } from '../../components/CompilationInfo';
import CreateYmlFile from '../../components/CreateYmlFile';
import DefaultProjectKey from '../../components/DefaultProjectKey';
import FinishButton from '../../components/FinishButton';
import RenderOptions from '../../components/RenderOptions';
import { OSs } from '../../types';

export interface CFamilyProps {
  branchesEnabled?: boolean;
  component: T.Component;
  onDone: () => void;
}

const STEPS = {
  [OSs.Linux]: `steps:
      - name: Checkout code
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Download and install the build wrapper, build the project
        run: |
          mkdir $HOME/.sonar
          curl -sSLo $HOME/.sonar/build-wrapper-linux-x86.zip \${{ secrets.SONAR_HOST_URL }}/static/cpp/build-wrapper-linux-x86.zip
          unzip -o $HOME/.sonar/build-wrapper-linux-x86.zip -d $HOME/.sonar/
          $HOME/.sonar/build-wrapper-linux-x86/build-wrapper-linux-x86-64 --out-dir bw-output <your clean build command>
        env:
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}

      - name: SonarQube analysis
        uses: SonarSource/sonarqube-scan-action@v1.0.0
        with:
          args: -Dsonar.cfamily.build-wrapper-output=bw-output
        env:
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}`,
  [OSs.MacOS]: `steps:
      - name: Checkout code
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Download and install the build wrapper
        run: |
          mkdir $HOME/.sonar
          curl -sSLo $HOME/.sonar/build-wrapper-macosx-x86.zip \${{ secrets.SONAR_HOST_URL }}/static/cpp/build-wrapper-macosx-x86.zip
          unzip -o $HOME/.sonar/build-wrapper-macosx-x86.zip -d $HOME/.sonar/
        env:
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}

      - name: Download and install the SonarScanner
        run: |
          curl -sSLo $HOME/.sonar/sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.6.2.2472-macosx.zip
          unzip -o $HOME/.sonar/sonar-scanner.zip -d $HOME/.sonar/

      - name: Build and analyse the project
        run: |
          # Potential improvement : add these paths to the PATH env var.
          $HOME/.sonar/build-wrapper-macosx-x86/build-wrapper-macosx-x86 --out-dir bw-output <your clean build command>
          $HOME/.sonar/sonar-scanner-4.6.2.2472-macosx/bin/sonar-scanner -Dsonar.cfamily.build-wrapper-output=bw-output
        env:
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}`,
  [OSs.Windows]: `steps:
      - name: Checkout code
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Download and install the build wrapper
        shell: powershell
        run: |
          $path = "$HOME/.sonar/build-wrapper-win-x86.zip"
          mkdir $HOME/.sonar
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
          (New-Object System.Net.WebClient).DownloadFile("\${{ secrets.SONAR_HOST_URL }}/static/cpp/build-wrapper-win-x86.zip", $path)
          Add-Type -AssemblyName System.IO.Compression.FileSystem
          [System.IO.Compression.ZipFile]::ExtractToDirectory($path, "$HOME/.sonar")
        env:
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}

      - name: Download and install the SonarScanner
        shell: powershell
        run: |
          $path = "$HOME/.sonar/sonar-scanner-cli-4.6.2.2472-windows.zip"
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
          (New-Object System.Net.WebClient).DownloadFile("https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.6.2.2472-windows.zip", $path)
          Add-Type -AssemblyName System.IO.Compression.FileSystem
          [System.IO.Compression.ZipFile]::ExtractToDirectory($path, "$HOME/.sonar")

      - name: Build and analyse the project
        shell: powershell
        run: |
          $env:Path += ";$HOME/.sonar/build-wrapper-win-x86;$HOME/.sonar/sonar-scanner-4.6.2.2472-windows/bin"
          build-wrapper-win-x86-64 --out-dir bw-output <your clean build command>
          sonar-scanner.bat "-Dsonar.cfamily.build-wrapper-output=bw-output"
        env:
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{ secrets.SONAR_HOST_URL }}`
};

const cfamilyYamlTemplate = (branchesEnabled: boolean, os: OSs) => `name: Build
on:
  push:
    branches:
      - master # or the name of your main branch
${branchesEnabled ? '  pull_request:\n    types: [opened, synchronize, reopened]' : ''}

jobs:
  build:
    runs-on: <image ready for your build toolchain>
    ${STEPS[os]}
`;

export default function CFamily(props: CFamilyProps) {
  const { component, branchesEnabled } = props;
  const [os, setOs] = React.useState<undefined | OSs>();

  return (
    <>
      <DefaultProjectKey component={component} />
      <li>
        <span>{translate('onboarding.build.other.os')}</span>
        <RenderOptions
          checked={os}
          name="os"
          onCheck={(value: OSs) => setOs(value)}
          optionLabelKey="onboarding.build.other.os"
          options={Object.values(OSs)}
        />
      </li>
      {os && (
        <>
          <CreateYmlFile
            yamlFileName=".github/workflows/build.yml"
            yamlTemplate={cfamilyYamlTemplate(!!branchesEnabled, os)}
          />
          <CompilationInfo className="abs-width-800" />
          <FinishButton onClick={props.onDone} />
        </>
      )}
    </>
  );
}
