import imgBep from '../assets/services/svc-bep.jpg';
import imgBep2 from '../assets/services/svc-bep-2.jpg';
import imgCameraMang from '../assets/services/svc-camera-mang.jpg';
import imgChamSoc from '../assets/services/svc-cham-soc.jpg';
import imgChamSoc2 from '../assets/services/svc-cham-soc-2.jpg';
import imgChamSocPet from '../assets/services/svc-cham-soc-pet.jpg';
import imgChamSocTaiNha from '../assets/services/svc-cham-soc-tai-nha.jpg';
import imgCongNghe from '../assets/services/svc-cong-nghe.jpg';
import imgContent from '../assets/services/svc-content.jpg';
import imgDienLanh from '../assets/services/svc-dien-lanh.jpg';
import imgDienNuoc from '../assets/services/svc-dien-nuoc.jpg';
import imgDoanhNghiep from '../assets/services/svc-doanh-nghiep.jpg';
import imgDoanhNghiep2 from '../assets/services/svc-doanh-nghiep-2.jpg';
import imgEsports from '../assets/services/svc-esports.jpg';
import imgExcel from '../assets/services/svc-excel.jpg';
import imgGame from '../assets/services/svc-game.jpg';
import imgGame2 from '../assets/services/svc-game-2.jpg';
import imgGiaSu from '../assets/services/svc-gia-su.jpg';
import imgGiatNem from '../assets/services/svc-giat-nem.jpg';
import imgHanhChinh from '../assets/services/svc-hanh-chinh.jpg';
import imgHoanThien from '../assets/services/svc-hoan-thien.jpg';
import imgHocTap from '../assets/services/svc-hoc-tap.jpg';
import imgHocTap2 from '../assets/services/svc-hoc-tap-2.jpg';
import imgKhuKhuan from '../assets/services/svc-khu-khuan.jpg';
import imgLamDep from '../assets/services/svc-lam-dep.jpg';
import imgLamDep2 from '../assets/services/svc-lam-dep-2.jpg';
import imgLamDepTaiNha from '../assets/services/svc-lam-dep-tai-nha.jpg';
import imgLapTrinh from '../assets/services/svc-lap-trinh.jpg';
import imgLapTrinh2 from '../assets/services/svc-lap-trinh-2.jpg';
import imgNauAn from '../assets/services/svc-nau-an.jpg';
import imgNhacHoa from '../assets/services/svc-nhac-hoa.jpg';
import imgNhaCua from '../assets/services/svc-nha-cua.jpg';
import imgNhaCua2 from '../assets/services/svc-nha-cua-2.jpg';
import imgOpLat from '../assets/services/svc-op-lat.jpg';
import imgPtTheThao from '../assets/services/svc-pt-the-thao.jpg';
import imgSanVuon from '../assets/services/svc-san-vuon.jpg';
import imgSanVuon2 from '../assets/services/svc-san-vuon-2.jpg';
import imgSanVuonNgoaiTroi from '../assets/services/svc-san-vuon-ngoai-troi.jpg';
import imgSangTao from '../assets/services/svc-sang-tao.jpg';
import imgSofaRem from '../assets/services/svc-sofa-rem.jpg';
import imgSonChongTham from '../assets/services/svc-son-chong-tham.jpg';
import imgSuKien from '../assets/services/svc-su-kien.jpg';
import imgSuKien2 from '../assets/services/svc-su-kien-2.jpg';
import imgSuKienTt from '../assets/services/svc-su-kien-tt.jpg';
import imgSuaChua from '../assets/services/svc-sua-chua.jpg';
import imgSuaChua2 from '../assets/services/svc-sua-chua-2.jpg';
import imgTaiChinh from '../assets/services/svc-tai-chinh.jpg';
import imgTaiChinh2 from '../assets/services/svc-tai-chinh-2.jpg';
import imgTheThao from '../assets/services/svc-the-thao.jpg';
import imgTheThao2 from '../assets/services/svc-the-thao-2.jpg';
import imgThietKe from '../assets/services/svc-thiet-ke.jpg';
import imgThietKe2 from '../assets/services/svc-thiet-ke-2.jpg';
import imgThuCung from '../assets/services/svc-thu-cung.jpg';
import imgThuCung2 from '../assets/services/svc-thu-cung-2.jpg';
import imgTocGoiDau from '../assets/services/svc-toc-goi-dau.jpg';
import imgTrongTre from '../assets/services/svc-trong-tre.jpg';
import imgVanChuyen from '../assets/services/svc-van-chuyen.jpg';
import imgVanPhong from '../assets/services/svc-van-phong.jpg';
import imgVeSinh from '../assets/services/svc-ve-sinh.jpg';
import imgVeSinhRemTham from '../assets/services/svc-ve-sinh-rem-tham.jpg';
import imgXayDung from '../assets/services/svc-xay-dung.jpg';
import imgXayDung2 from '../assets/services/svc-xay-dung-2.jpg';
import imgXe from '../assets/services/svc-xe.jpg';
import imgXe2 from '../assets/services/svc-xe-2.jpg';

/** Ảnh do AI tạo riêng theo từng Service; tên file phải trùng service.slug. */
const perServiceModules = import.meta.glob<{ default: string }>(
  '../assets/services/by-service/*.jpg',
  { eager: true },
);
const generatedServiceImages: Record<string, string> = Object.fromEntries(
  Object.entries(perServiceModules).map(([path, module]) => [
    path.split('/').pop()!.replace(/\.jpg$/, ''),
    module.default,
  ]),
);

/** Ảnh đại diện nhóm (trang nhóm / tile). */
const groupImages: Record<string, string> = {
  'nha-cua': imgNhaCua,
  'sua-chua': imgSuaChua,
  'xay-dung': imgXayDung,
  'cham-soc': imgChamSoc,
  'lam-dep': imgLamDep,
  'bep-doi-song': imgBep,
  xe: imgXe,
  'hoc-tap': imgHocTap,
  game: imgGame,
  'lap-trinh': imgLapTrinh,
  'thiet-ke': imgThietKe,
  'su-kien': imgSuKien,
  'thu-cung': imgThuCung,
  'the-thao': imgTheThao,
  'doanh-nghiep': imgDoanhNghiep,
  'tai-chinh': imgTaiChinh,
  'san-vuon': imgSanVuon,
  'marketing-online': imgContent,
  'ngon-ngu': imgHocTap2,
  'tro-ly-tu-xa': imgVanPhong,
  'tu-van-phat-trien': imgChamSoc2,
  'giai-tri': imgSuKien2,
};

/** Ảnh riêng theo danh mục — mỗi danh mục một hình để không trùng trong cùng nhóm. */
const categoryImages: Record<string, string> = {
  've-sinh': imgVeSinh,
  'sofa-rem-tham': imgSofaRem,
  'khu-khuan': imgKhuKhuan,
  'dien-lanh': imgDienLanh,
  'dien-nuoc': imgDienNuoc,
  'camera-mang': imgCameraMang,
  'son-chong-tham': imgSonChongTham,
  'hoan-thien': imgHoanThien,
  'op-lat-thach-cao': imgOpLat,
  'cham-soc-tai-nha': imgChamSocTaiNha,
  'trong-tre': imgTrongTre,
  'lam-dep-tai-nha': imgLamDepTaiNha,
  'toc-goi-dau': imgTocGoiDau,
  'nau-an-doi-song': imgNauAn,
  'van-chuyen': imgVanChuyen,
  'gia-su': imgGiaSu,
  'nhac-hoa-tin-hoc': imgNhacHoa,
  esports: imgEsports,
  'cong-nghe': imgCongNghe,
  'tu-dong-hoa': imgExcel,
  'sang-tao': imgSangTao,
  'content-kenh': imgContent,
  'su-kien-truyen-thong': imgSuKienTt,
  'cham-soc-pet': imgChamSocPet,
  'pt-the-thao': imgPtTheThao,
  'van-phong': imgVanPhong,
  'hanh-chinh': imgHanhChinh,
  'san-vuon-ngoai-troi': imgSanVuonNgoaiTroi,
  'su-kien-truc-tuyen': imgSuKien2,
  'huan-luyen-online': imgTheThao2,
  'van-hanh-tu-xa': imgDoanhNghiep2,
  'quang-cao-so': imgDoanhNghiep2,
  'van-hanh-kenh-ban': imgContent,
  'bien-dich': imgGiaSu,
  'phien-dich-phu-de': imgHocTap2,
  'tro-ly-ao': imgHanhChinh,
  'nhap-lieu-bao-cao': imgExcel,
  'huong-nghiep-su-nghiep': imgDoanhNghiep,
  'ky-nang-can-bang': imgChamSoc2,
  'bieu-dien-online': imgSuKien2,
  'tro-choi-giai-tri': imgGame2,
  'dong-hanh-giai-tri': imgHocTap2,
};

/** Ảnh riêng theo nghề — dùng khi các nghề trong cùng danh mục cần hình khác nhau. */
const serviceImages: Record<string, string> = {
  'giat-sofa': imgSofaRem,
  'giat-nem': imgGiatNem,
  've-sinh-rem-tham': imgVeSinhRemTham,
};

/** Biến thể theo nhóm — chọn ổn định theo slug nghề khi cùng category. */
const groupVariants: Record<string, string[]> = {
  'nha-cua': [imgNhaCua, imgNhaCua2, imgSofaRem, imgKhuKhuan],
  'sua-chua': [imgSuaChua, imgSuaChua2, imgDienLanh, imgDienNuoc, imgCameraMang, imgSonChongTham],
  'xay-dung': [imgXayDung, imgXayDung2, imgOpLat],
  'cham-soc': [imgChamSoc, imgChamSoc2, imgTrongTre],
  'lam-dep': [imgLamDep, imgLamDep2, imgTocGoiDau],
  'bep-doi-song': [imgBep, imgBep2],
  xe: [imgXe, imgXe2],
  'hoc-tap': [imgHocTap, imgHocTap2, imgNhacHoa],
  game: [imgGame, imgGame2],
  'lap-trinh': [imgLapTrinh, imgLapTrinh2, imgExcel],
  'thiet-ke': [imgThietKe, imgThietKe2, imgContent],
  'su-kien': [imgSuKien, imgSuKien2],
  'thu-cung': [imgThuCung, imgThuCung2],
  'the-thao': [imgTheThao, imgTheThao2],
  'doanh-nghiep': [imgDoanhNghiep, imgDoanhNghiep2],
  'tai-chinh': [imgTaiChinh, imgTaiChinh2],
  'san-vuon': [imgSanVuon, imgSanVuon2],
  'marketing-online': [imgContent, imgSangTao, imgDoanhNghiep2],
  'ngon-ngu': [imgHocTap2, imgGiaSu, imgHocTap],
  'tro-ly-tu-xa': [imgVanPhong, imgHanhChinh, imgExcel],
  'tu-van-phat-trien': [imgChamSoc2, imgDoanhNghiep, imgTaiChinh2],
  'giai-tri': [imgSuKien2, imgGame2, imgHocTap2, imgSuKien],
};

function hashSeed(seed: string) {
  let value = 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = (value * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return value;
}

export function groupImage(slug: string | null | undefined): string {
  return groupImages[slug ?? ''] ?? imgNhaCua;
}

type ServiceImageInput = {
  slug: string;
  category: {
    slug: string;
    group: { slug: string };
  };
};

/** Ảnh thẻ / chi tiết nghề: ảnh nghề riêng; nếu chưa có thì xoay ảnh danh mục + nhóm theo slug. */
export function serviceImage(service: ServiceImageInput): string {
  const serviceImage =
    generatedServiceImages[service.slug] ?? serviceImages[service.slug];
  if (serviceImage) return serviceImage;

  const groupSlug = service.category.group.slug;
  const categoryImage = categoryImages[service.category.slug];
  const variants = [
    ...(categoryImage ? [categoryImage] : []),
    ...(groupVariants[groupSlug] ?? []),
  ].filter((image, index, list) => list.indexOf(image) === index);
  if (variants?.length) {
    return variants[hashSeed(service.slug) % variants.length]!;
  }
  return groupImage(groupSlug);
}
