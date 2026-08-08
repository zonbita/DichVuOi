export declare class UploadsController {
    uploadEvidence(file?: Express.Multer.File): {
        url: string;
        fileName: string;
        size: number;
    };
    uploadAvatar(file?: Express.Multer.File): {
        url: string;
        fileName: string;
        size: number;
    };
    uploadServicePost(file?: Express.Multer.File): {
        url: string;
        fileName: string;
        size: number;
    };
}
