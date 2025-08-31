export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case DocumentStatus.APPROVED:
      return '#22D883';
    case DocumentStatus.REJECTED:
      return '#FF6B6B';
    case DocumentStatus.PENDING:
      return '#FFA500';
    default:
      return '#666';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case DocumentStatus.APPROVED:
      return 'Aprovado';
    case DocumentStatus.REJECTED:
      return 'Rejeitado';
    case DocumentStatus.PENDING:
      return 'Pendente';
    default:
      return 'Desconhecido';
  }
};
