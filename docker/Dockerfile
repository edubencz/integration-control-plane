# Copyright (c) 2026, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
#
# WSO2 Inc. licenses this file to you under the Apache License,
# Version 2.0 (the "License"); you may not use this file except
# in compliance with the License.
# You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

# The CI pipeline can point this at the internal Docker Hub mirror.
ARG BALLERINA_IMAGE=ballerina/ballerina:2201.13.4

# Stage 1: Build frontend using Node.js 22 (Vite requires v20.19+ or v22.12+)
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Required for pnpm to run non-interactively in Docker (no TTY)
ENV CI=true

COPY frontend/ ./

# --no-frozen-lockfile: pnpm-lock.yaml was generated on macOS; allow pnpm to
# resolve platform-native optional deps (e.g. @rollup/rollup-linux-arm64-musl)
RUN npm install -g pnpm@9 && \
    pnpm install --no-frozen-lockfile && \
    pnpm build

# Stage 2: Build stage with Ballerina and Gradle
FROM ${BALLERINA_IMAGE} AS builder

# Install required dependencies (using apk for Alpine-based image)
USER root

RUN apk add --no-cache wget unzip zip bash

# Set working directory
WORKDIR /app

# Copy gradle wrapper and gradle files
COPY gradlew ./
COPY gradlew.bat ./
COPY gradle/ ./gradle/
COPY build.gradle ./
COPY settings.gradle ./
COPY gradle.properties ./

# Copy source code
COPY icp_server/ ./icp_server/
COPY icp_server/target/bin/icp_server.jar ./icp_server/target/bin/icp_server.jar
COPY conf/ ./conf/
COPY distribution/ ./distribution/

# Make gradlew executable
RUN chmod +x ./gradlew

# Copy the pre-built frontend dist from stage 1 (avoids needing Node.js in this stage)
COPY --from=frontend-builder /app/frontend/dist/ ./frontend/dist/

# Package the already-built backend JAR, skipping the frontend task because it
# was built above and the e2e check because its browser/server dependencies are
# not present in this image.
RUN ./gradlew clean packageICP -PskipBuildICP -x buildFrontend -x check

# Stage 3: Runtime stage
FROM eclipse-temurin:21-jdk

# Define build argument for ICP version
ARG ICP_VERSION=2.0.0-SNAPSHOT

# Install unzip
RUN apt-get update && \
    apt-get install -y unzip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /home/wso2

# Copy the distribution zip file from builder stage
COPY --from=builder /app/build/distribution/wso2-integration-control-plane-${ICP_VERSION}.zip /home/wso2/

# Unzip the distribution and remove the zip file
RUN unzip wso2-integration-control-plane-${ICP_VERSION}.zip && \
    rm wso2-integration-control-plane-${ICP_VERSION}.zip && \
    groupadd --gid 10001 wso2 && \
    useradd --uid 10001 --gid 10001 --home-dir /home/wso2 --no-create-home wso2 && \
    chown -R 10001:10001 /home/wso2

# Set working directory to the unzipped distribution home
WORKDIR /home/wso2/wso2-integration-control-plane-${ICP_VERSION}

# Expose ports (HTTPS, GraphQL, Observability, OpenSearch Adaptor)
EXPOSE 9445 9446 9449

# Ensure the script is executable
RUN chmod +x bin/icp.sh

USER 10001:10001

# Run the startup script
ENTRYPOINT ["bin/icp.sh"]
