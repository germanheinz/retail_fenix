{{- define "retail-fenix.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

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

{{- define "retail-fenix.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "retail-fenix.labels" -}}
helm.sh/chart: {{ include "retail-fenix.chart" . }}
{{ include "retail-fenix.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "retail-fenix.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retail-fenix.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "retail-fenix.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "retail-fenix.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/* DynamoDB helpers */}}

{{- define "retail-fenix.dynamodb.fullname" -}}
{{- include "retail-fenix.fullname" . }}-dynamodb
{{- end -}}

{{- define "retail-fenix.dynamodb.labels" -}}
helm.sh/chart: {{ include "retail-fenix.chart" . }}
{{ include "retail-fenix.dynamodb.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "retail-fenix.dynamodb.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retail-fenix.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: dynamodb
{{- end }}

{{- define "retail-fenix.dynamodb.endpoint" -}}
{{- if and (eq "dynamodb" .Values.app.persistence.provider) .Values.dynamodb.create -}}
{{ include "retail-fenix.dynamodb.fullname" . }}:{{ .Values.dynamodb.service.port }}
{{- else -}}
{{- .Values.app.persistence.dynamodb.endpoint -}}
{{- end -}}
{{- end -}}
