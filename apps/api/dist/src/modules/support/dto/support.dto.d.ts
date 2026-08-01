export declare class CreateSupportMessageDto {
    body: string;
}
export declare class UpdateSupportThreadDto {
    status?: 'OPEN' | 'CLOSED';
    assigneeId?: string | null;
}
