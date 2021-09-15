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
package org.sonar.server.almsettings.ws;

import org.sonar.alm.client.azure.AzureDevOpsHttpClient;
import org.sonar.alm.client.bitbucket.bitbucketcloud.BitbucketCloudRestClient;
import org.sonar.api.config.internal.Encryption;
import org.sonar.api.config.internal.Settings;
import org.sonar.api.server.ws.Request;
import org.sonar.api.server.ws.Response;
import org.sonar.api.server.ws.WebService;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.alm.setting.AlmSettingDto;
import org.sonar.server.almintegration.validator.BitbucketServerSettingsValidator;
import org.sonar.server.almintegration.validator.GithubGlobalSettingsValidator;
import org.sonar.server.almintegration.validator.GitlabGlobalSettingsValidator;
import org.sonar.server.user.UserSession;

public class ValidateAction implements AlmSettingsWsAction {

  private static final String PARAM_KEY = "key";

  private final DbClient dbClient;
  private final Encryption encryption;
  private final UserSession userSession;
  private final AlmSettingsSupport almSettingsSupport;
  private final AzureDevOpsHttpClient azureDevOpsHttpClient;
  private final GitlabGlobalSettingsValidator gitlabSettingsValidator;
  private final GithubGlobalSettingsValidator githubGlobalSettingsValidator;
  private final BitbucketServerSettingsValidator bitbucketServerSettingsValidator;
  private final BitbucketCloudRestClient bitbucketCloudRestClient;

  public ValidateAction(DbClient dbClient,
    Settings settings,
    UserSession userSession,
    AlmSettingsSupport almSettingsSupport,
    AzureDevOpsHttpClient azureDevOpsHttpClient,
    GithubGlobalSettingsValidator githubGlobalSettingsValidator,
    GitlabGlobalSettingsValidator gitlabSettingsValidator,
    BitbucketServerSettingsValidator bitbucketServerSettingsValidator,
    BitbucketCloudRestClient bitbucketCloudRestClient) {
    this.dbClient = dbClient;
    this.encryption = settings.getEncryption();
    this.userSession = userSession;
    this.almSettingsSupport = almSettingsSupport;
    this.azureDevOpsHttpClient = azureDevOpsHttpClient;
    this.githubGlobalSettingsValidator = githubGlobalSettingsValidator;
    this.gitlabSettingsValidator = gitlabSettingsValidator;
    this.bitbucketServerSettingsValidator = bitbucketServerSettingsValidator;
    this.bitbucketCloudRestClient = bitbucketCloudRestClient;
  }

  @Override
  public void define(WebService.NewController context) {
    WebService.NewAction action = context.createAction("validate")
      .setDescription("Validate an ALM Setting by checking connectivity and permissions<br/>" +
        "Requires the 'Administer System' permission")
      .setSince("8.6")
      .setHandler(this);

    action.createParam(PARAM_KEY)
      .setRequired(true)
      .setMaximumLength(200)
      .setDescription("Unique key of the ALM settings");
  }

  @Override
  public void handle(Request request, Response response) {
    userSession.checkIsSystemAdministrator();
    doHandle(request);
    response.noContent();
  }

  private void doHandle(Request request) {
    String key = request.mandatoryParam(PARAM_KEY);

    try (DbSession dbSession = dbClient.openSession(false)) {
      AlmSettingDto almSettingDto = almSettingsSupport.getAlmSetting(dbSession, key);
      switch (almSettingDto.getAlm()) {
        case GITLAB:
          gitlabSettingsValidator.validate(almSettingDto);
          break;
        case GITHUB:
          githubGlobalSettingsValidator.validate(almSettingDto);
          break;
        case BITBUCKET:
          bitbucketServerSettingsValidator.validate(almSettingDto);
          break;
        case BITBUCKET_CLOUD:
          validateBitbucketCloud(almSettingDto);
          break;
        case AZURE_DEVOPS:
          validateAzure(almSettingDto);
          break;
      }
    }
  }

  private void validateAzure(AlmSettingDto almSettingDto) {
    try {
      azureDevOpsHttpClient.checkPAT(almSettingDto.getUrl(), almSettingDto.getDecryptedPersonalAccessToken(encryption));
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid Azure URL or Personal Access Token", e);
    }
  }

  private void validateBitbucketCloud(AlmSettingDto almSettingDto) {
    bitbucketCloudRestClient.validate(almSettingDto.getClientId(), almSettingDto.getDecryptedClientSecret(encryption), almSettingDto.getAppId());
  }
}
