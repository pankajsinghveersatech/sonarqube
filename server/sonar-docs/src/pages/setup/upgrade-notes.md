---
title: Release Upgrade Notes
url: /setup/upgrade-notes/
---

## Release 9.1 Upgrade Notes  
**Custom measures feature has been dropped**
The custom measures feature, which was previously deprecated, has been removed. ([SONAR-10762](https://jira.sonarsource.com/browse/SONAR-10762)).

**Deprecated WebAPI endpoints and parameters removal**
The WebAPI endpoints and parameters deprecated during the 7.X release cycle have been removed. For a complete list of removed endpoints and parameters see [SONAR-15313](https://jira.sonarsource.com/browse/SONAR-15313).

## Release 9.0 Upgrade Notes  
**Scanners require Java 11**  
Java 11 is required for SonarQube scanners. Use of Java 8 is no longer supported. See the documentation on [Moving Analysis to Java 11](/analysis/analysis-with-java-11/) for more information. ([MMF-2051](https://jira.sonarsource.com/browse/MMF-2051)).

**Support for Internet Explorer 11 dropped**  
Support for Internet Explorer 11 and other legacy browsers has been dropped. ([SONAR-14387](https://jira.sonarsource.com/browse/SONAR-14387)).

**Reporting Quality Gate status on GitHub branches requires an additional permission**  
When working in private GitHub repositories, you need to grant read-only access to the **Contents** permission on the GitHub application that you're using for SonarQube integration. See the [GitHub integration documentation](/analysis/github-integration/) for more information.

**JavaScript custom rule API removed**  
The JavaScript custom rule API, which was previously deprecated, has been removed. Plugins can no longer use this API to implement custom rules. See the [JavaScript documentation](/analysis/languages/javascript/) for more information. ([SONAR-14928](https://jira.sonarsource.com/browse/SONAR-14928)).

**Deprecated Plugin Java API dropped**  
Parts of the Java API for plugins that were deprecated before SonarQube 7.0 have been dropped. You should compile plugins against SonarQube 9.0 to ensure they're compatible and to check if they're using a deprecated API that has been dropped. ([SONAR-14925](https://jira.sonarsource.com/browse/SONAR-14925), [SONAR-14885](https://jira.sonarsource.com/browse/SONAR-14885)).

[Full release notes](https://jira.sonarsource.com/secure/ReleaseNote.jspa?projectId=10930&version=15682)

## Release 8.9 LTS Upgrade Notes  
Upgrading directly from SonarQube _v7.9 LTS to v8.9 LTS_? Refer to the [LTS to LTS Release Upgrade Notes](/setup/lts-to-lts-upgrade-notes/).

**GitHub Enterprise compatibility**  
SonarQube 8.9 only supports GitHub Enterprise 2.21+ for pull request decoration (the previous minimum version was 2.15).

**Plugins require risk consent**  
When upgrading, if you're using plugins, a SonarQube administrator needs to acknowledge the risk involved with plugin installation when prompted in SonarQube. ([MMF-2301](https://jira.sonarsource.com/browse/MMF-2301)).

**Database support updated**  
SonarQube 8.9 supports the following database versions:

* PostgreSQL versions 9.6 to 13. PostgreSQL versions <9.6 are no longer supported.
* MSSQL Server 2014, 2016, 2017, and 2019.
* Oracle XE, 12C, 18C, and 19C. Oracle 11G is no longer supported.

**Webhooks aren't allowed to target the instance**  
To improve security, webhooks, by default, aren't allowed to point to the SonarQube server. You can change this behavior in the configuration. ([SONAR-14682](https://jira.sonarsource.com/browse/SONAR-14682)).

[Full release notes](https://jira.sonarsource.com/secure/ReleaseNote.jspa?projectId=10930&version=16710)
