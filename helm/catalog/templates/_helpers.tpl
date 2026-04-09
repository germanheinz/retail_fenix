{{/*
Expand the name of the chart.
*/}}
{{- define "retail-fenix.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "retail-fenix.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "retail-fenix.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "retail-fenix.labels" -}}
helm.sh/chart: {{ include "retail-fenix.chart" . }}
{{ include "retail-fenix.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "retail-fenix.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retail-fenix.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "retail-fenix.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "retail-fenix.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/* MySQL helpers */}}

{{- define "retail-fenix.mysql.fullname" -}}
{{- include "retail-fenix.fullname" . }}-mysql
{{- end -}}

{{- define "retail-fenix.mysql.labels" -}}
helm.sh/chart: {{ include "retail-fenix.chart" . }}
{{ include "retail-fenix.mysql.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "retail-fenix.mysql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retail-fenix.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: mysql
{{- end }}

{{- define "getOrGeneratePass" }}
{{- $len := (default 16 .Length) | int -}}
{{- $obj := (lookup "v1" .Kind .Namespace .Name).data -}}
{{- if $obj }}
{{- index $obj .Key -}}
{{- else if (eq (lower .Kind) "secret") -}}
{{- randAlphaNum $len | b64enc -}}
{{- else -}}
{{- randAlphaNum $len -}}
{{- end -}}
{{- end }}

{{- define "retail-fenix.mysql.password" -}}
{{- if not (empty .Values.app.persistence.secret.password) -}}
    {{- .Values.app.persistence.secret.password | b64enc -}}
{{- else -}}
    {{- include "getOrGeneratePass" (dict "Namespace" .Release.Namespace "Kind" "Secret" "Name" .Values.app.persistence.secret.name "Key" "RETAIL_CATALOG_PERSISTENCE_PASSWORD") -}}
{{- end -}}
{{- end -}}

{{- define "retail-fenix.mysql.endpoint" -}}
{{- if .Values.mysql.create -}}
{{ include "retail-fenix.mysql.fullname" . }}:{{ .Values.mysql.service.port }}
{{- else -}}
{{- .Values.app.persistence.endpoint -}}
{{- end -}}
{{- end -}}
