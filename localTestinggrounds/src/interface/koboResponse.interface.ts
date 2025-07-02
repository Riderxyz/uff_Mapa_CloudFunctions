
export interface KoboResponseInterface {
  count: number
  next: any
  previous: any
  results: KoboResultInterface[]
}

export interface KoboResultInterface {
  _id: number
  "formhub/uuid": string
  start: string
  end: string
  "start-geopoint": string
  today: string
  username: string
  deviceid: string
  phonenumber: string
  "group_identificacao/monitor_responsavel_1": string
  "group_identificacao/cpf_monitor_responsavel_1": string
  "group_identificacao/monitor_responsavel_2": string
  "group_identificacao/cpf_monitor_responsavel_2": string
  "group_identificacao/data_visita": string
  "group_dados_entidade/estado": string
  "group_dados_entidade/entidade": string
  "group_dados_entidade/razao_social": string
  "group_dados_entidade/cnpj": string
  "group_dados_entidade/logradouro": string
  "group_dados_entidade/numero": string
  "group_dados_entidade/bairro": string
  "group_dados_entidade/municipio": string
  "group_dados_entidade/cep": string
  "group_dados_entidade/email": string
  "group_dados_entidade/telefone": string
  "group_dados_entidade/possui_alteracao_endereco": string
  "group_termo_fomento/termo_fomento": string
  "group_termo_fomento/numero_processo": string
  "group_termo_fomento/numero_instrumento": string
  "group_termo_fomento/numero_proposta": string
  "group_termo_fomento/caracterizacao_interna": string
  "group_termo_fomento/publico_alvo": string
  "group_termo_fomento/problema_resolvido": string
  "group_termo_fomento/resultados_esperados": string
  "group_termo_fomento/categorias": string
  "group_termo_fomento/objeto_convenio": string
  "group_termo_fomento/capacidade_tecnica": string
  "group_termo_fomento/inicio_vigencia": string
  "group_termo_fomento/termino_vigencia": string
  "group_termo_fomento/data_prestacao": string
  "group_termo_fomento/valor_concedente": string
  qtd_metas: string
  "group_plano_trabalho/metas_repeat": GroupPlanoTrabalhoMetasRepeatInterface[]
  "group_questoes_gerais/objeto_cronograma_satisfatorio": string
  "group_questoes_gerais/obs_cronograma_satisfatorio"?: string
  "group_questoes_gerais/objeto_quantidade_periodo_satisfatorio": string
  "group_questoes_gerais/obs_quantidade_periodo_satisfatorio"?: string
  "group_questoes_gerais/objeto_endereco_correto": string
  "group_questoes_gerais/obs_endereco_correto"?: string
  "group_questoes_gerais/objeto_validacao_fornecedor": string
  "group_questoes_gerais/obs_validacao_fornecedor"?: string
  "group_questoes_gerais/objeto_publicidade": string
  "group_questoes_gerais/obs_publicidade"?: string
  "group_questoes_gerais/objeto_acesso_informacoes": string
  "group_questoes_gerais/obs_acesso_informacoes"?: string
  group_fotos_etapa: GroupFotosEtapaInterface[]
  "group_assinatura/permitiu_monitoramento": string
  "group_assinatura/group_identificacao_001/representante_entidade": string
  "group_assinatura/group_identificacao_001/possui_assinatura_responsavel": string
  "group_assinatura/group_identificacao_001/assinatura_representante": string
  __version__: string
  "meta/instanceID": string
  _xform_id_string: string
  _uuid: string
  "meta/rootUuid": string
  _attachments: AttachmentInterface[]
  _status: string
  _geolocation: number[]
  _submission_time: string
  _tags: any[]
  _notes: any[]
  _validation_status: ValidationStatus
  _submitted_by: string
  "group_dados_entidade/motivo_alteracao_endereco"?: string
  "group_dados_entidade/outro_motivo_alteracao_endereco"?: string
}

export interface GroupPlanoTrabalhoMetasRepeatInterface {
  "group_plano_trabalho/metas_repeat/meta_index": string
  "group_plano_trabalho/metas_repeat/group_meta/id_meta": string
  "group_plano_trabalho/metas_repeat/group_meta/meta_descricao": string
  "group_plano_trabalho/metas_repeat/group_meta/meta_valor": string
  "group_plano_trabalho/metas_repeat/group_meta/meta_data_inicio": string
  "group_plano_trabalho/metas_repeat/group_meta/meta_data_termino": string
  "group_plano_trabalho/metas_repeat/group_meta/meta_quantidade": string
  "group_plano_trabalho/metas_repeat/group_meta/meta_unidade_fornecimento": string
  "group_plano_trabalho/metas_repeat/group_meta/qtd_etapas": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat": GroupPlanoTrabalhoMetasRepeatGroupMetaEtapasRepeatInterface[]
}

export interface GroupPlanoTrabalhoMetasRepeatGroupMetaEtapasRepeatInterface {
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/etapa_index": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/id_etapa": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_descricao": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_valor": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_data_inicio": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_data_termino": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_quantidade": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_unidade_fornecimento": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_endereco": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_existencia_unidade": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_uso_devido": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/etapa_cronograma": string
  "group_plano_trabalho/metas_repeat/group_meta/etapas_repeat/group_etapa/obs_etapa": string
}

export interface GroupFotosEtapaInterface {
  "group_fotos_etapa/foto_etapa": string
  "group_fotos_etapa/rotulo_etapa": string
}

export interface AttachmentInterface {
  download_url: string
  download_large_url: string
  download_medium_url: string
  download_small_url: string
  mimetype: string
  filename: string
  instance: number
  xform: number
  id: number
  question_xpath: string
}

export interface ValidationStatus {

  timestamp: number
  uid: string
  by_whom: string
  label?: 'Approved' | 'Rejected';
}
