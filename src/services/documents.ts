import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';
import { decode as base64Decode } from 'base-64';

export interface DocumentType {
  id: number;
  document_name: string;
  required: boolean;
}

export interface UserDocument {
  id: number;
  user_id: string;
  type: number;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedIn?: string;
  reason?: string;
  created_at: string;
  document_type?: DocumentType;
}

export const documentsService = {
  // Buscar todos os tipos de documento
  async getDocumentTypes(): Promise<DocumentType[]> {
    const { data, error } = await supabase
      .from('document_type')
      .select('*')
      .order('document_name');

    if (error) throw error;
    return data || [];
  },

  // Buscar documentos do usuário
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const { data, error } = await supabase
      .from('professional_document')
      .select(`
        *,
        document_type (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async uploadDocument(
    userId: string,
    documentTypeId: number,
    file: { uri: string; type: string; name: string }
  ): Promise<string> {
    try {
      const fileExtension = file.name?.split('.').pop() || 'jpg';
      const fileName = `${userId}/${documentTypeId}_${Date.now()}.${fileExtension}`;
      
      console.log('Iniciando upload:', { fileName, fileType: file.type });

      // Ler o arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });

      // Converter base64 para binário
      const binary = base64Decode(base64);
      const fileBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        fileBytes[i] = binary.charCodeAt(i);
      }

      console.log('Arquivo processado:', { 
        originalSize: binary.length, 
        bytesSize: fileBytes.length 
      });

      // Determinar content type correto
      let contentType = file.type || 'application/octet-stream';
      if (file.name?.toLowerCase().includes('.pdf')) {
        contentType = 'application/pdf';
      } else if (file.name?.toLowerCase().match(/\.(jpg|jpeg)$/)) {
        contentType = 'image/jpeg';
      } else if (file.name?.toLowerCase().includes('.png')) {
        contentType = 'image/png';
      }

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, fileBytes, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType,
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw error;
      }

      console.log('Upload realizado com sucesso:', data);
      return data.path;

    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      throw error;
    }
  },

  // Criar registro de documento no banco
  async createDocumentRecord(
    userId: string,
    documentTypeId: number,
    filePath: string
  ): Promise<void> {
    const { error } = await supabase
      .from('professional_document')
      .insert({
        user_id: userId,
        type: documentTypeId,
        url: filePath,
        status: 'pending',
      });

    if (error) throw error;
  },

  // Gerar URL pública (corrigido para usar URL pública)
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Gerar URL assinada para preview (mantido como alternativa)
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Não foi possível gerar URL assinada');
    
    return data.signedUrl;
  },

  // Reenviar documento (deletar o anterior e criar novo) - MÉTODO CORRIGIDO
  async resubmitDocument(
    userId: string,
    documentTypeId: number,
    file: { uri: string; type: string; name: string }
  ): Promise<void> {
    try {
      // Buscar documento anterior
      const { data: existingDoc } = await supabase
        .from('professional_document')
        .select('*')
        .eq('user_id', userId)
        .eq('type', documentTypeId)
        .single();

      // Upload do novo arquivo usando o método corrigido
      const newFilePath = await this.uploadDocument(userId, documentTypeId, file);

      // Atualizar registro no banco
      const { error } = await supabase
        .from('professional_document')
        .update({
          url: newFilePath,
          status: 'pending',
          reason: null, // Limpar motivo da rejeição anterior
          reviewedBy: null,
          reviewedIn: null,
        })
        .eq('user_id', userId)
        .eq('type', documentTypeId);

      if (error) throw error;

      // Deletar arquivo anterior se existir
      if (existingDoc?.url) {
        try {
          await supabase.storage
            .from('documents')
            .remove([existingDoc.url]);
        } catch (deleteError) {
          console.warn('Erro ao deletar arquivo anterior:', deleteError);
        }
      }
    } catch (error) {
      console.error('Erro no reenvio:', error);
      throw error;
    }
  },

  // Deletar documento
  async deleteDocument(documentId: number): Promise<void> {
    // Buscar documento
    const { data: document } = await supabase
      .from('professional_document')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!document) throw new Error('Documento não encontrado');

    // Deletar arquivo do storage
    try {
      await supabase.storage
        .from('documents')
        .remove([document.url]);
    } catch (deleteError) {
      console.warn('Erro ao deletar arquivo:', deleteError);
    }

    // Deletar registro do banco
    const { error } = await supabase
      .from('professional_document')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },
};