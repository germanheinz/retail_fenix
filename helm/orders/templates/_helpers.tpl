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

{{/* PostgreSQL helpers */}}

{{- define "retail-fenix.postgresql.fullname" -}}
{{- include "retail-fenix.fullname" . }}-postgresql
{{- end -}}

{{- define "retail-fenix.postgresql.labels" -}}
helm.sh/chart: {{ include "retail-fenix.chart" . }}
{{ include "retail-fenix.postgresql.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "retail-fenix.postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retail-fenix.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: postgresql
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

{{- define "retail-fenix.postgresql.password" -}}
{{- if not (empty .Values.app.persistence.secret.password) -}}
    {{- .Values.app.persistence.secret.password | b64enc -}}
{{- else -}}
    {{- include "getOrGeneratePass" (dict "Namespace" .Release.Namespace "Kind" "Secret" "Name" .Values.app.persistence.secret.name "Key" "RETAIL_ORDERS_PERSISTENCE_PASSWORD") -}}
{{- end -}}
{{- end -}}

{{- define "retail-fenix.postgresql.endpoint" -}}
{{- if .Values.postgresql.create -}}
{{ include "retail-fenix.postgresql.fullname" . }}:{{ .Values.postgresql.service.port }}
{{- else }}
{{- .Values.app.persistence.endpoint -}}
{{- end -}}
{{- end -}}

{{/* RabbitMQ helpers */}}

{{- define "retail-fenix.rabbitmq.fullname" -}}
{{- include "retail-fenix.fullname" . }}-rabbitmq
{{- end -}}

{{- define "retail-fenix.rabbitmq.labels" -}}
helm.sh/chart: {{ include "retail-fenix.chart" . }}
{{ include "retail-fenix.rabbitmq.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "retail-fenix.rabbitmq.selectorLabels" -}}
app.kubernetes.io/name: {{ include "retail-fenix.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: rabbitmq
{{- end }}

{{- define "retail-fenix.rabbitmq.addresses" -}}
{{- if .Values.rabbitmq.create -}}
{{ include "retail-fenix.rabbitmq.fullname" . }}:{{ .Values.rabbitmq.service.amqp.port }}
{{- else -}}
{{- join "," .Values.app.messaging.rabbitmq.addresses -}}
{{- end -}}
{{- end -}}
