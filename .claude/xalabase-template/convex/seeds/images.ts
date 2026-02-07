/**
 * Image paths for seed data - using local seed-images folder
 * Each subcategory has enough images to avoid duplicates
 */

export interface ImageDefinition {
    url: string;
    alt: string;
    isPrimary?: boolean;
}

// Base path for seed images
const BASE_PATH = "/seed-images";

// Images organized by category/subcategory - expanded to avoid duplicates
export const IMAGES = {
    // ===== LOKALER =====

    SELSKAPSLOKALE: [
        { url: `${BASE_PATH}/Selskapslokaler/Julebygda-grendahus-salen-selskapslokale-2.jpg`, alt: "Selskapslokale med festoppsett" },
        { url: `${BASE_PATH}/Selskapslokaler/storaas_bryllup-2.jpg`, alt: "Bryllupslokale" },
        { url: `${BASE_PATH}/Selskapslokaler/norway-bergen-selskapslokaler-event-venues-and-banquet-halls-restaurants-bryllup-11.avif`, alt: "Festlokale Bergen" },
        { url: `${BASE_PATH}/Selskapslokaler/inside.jpg`, alt: "Innendørs selskapslokale" },
        { url: `${BASE_PATH}/Selskapslokaler/catering.jpg`, alt: "Selskapslokale med catering" },
        { url: `${BASE_PATH}/Selskapslokaler/1ZQSyaO8dmvay9ZuLZDjD.jpg`, alt: "Moderne selskapslokale" },
        { url: `${BASE_PATH}/Selskapslokaler/11b22e7c96134a8fb73de246521188d1.jpg`, alt: "Elegant festlokale" },
        { url: `${BASE_PATH}/Selskapslokaler/20241101_BH_VA_Mortens_Kro_tilbygg_011.jpg`, alt: "Selskapslokale tilbygg" },
        { url: `${BASE_PATH}/Selskapslokaler/KH_KBOUS3.jpg`, alt: "Kulturhus selskapslokale" },
        { url: `${BASE_PATH}/Selskapslokaler/Ry002_wfwrd4.jpg`, alt: "Festlokale med utsikt" },
        { url: `${BASE_PATH}/Selskapslokaler/mat-1.jpg`, alt: "Selskapslokale servering" },
        { url: `${BASE_PATH}/Selskapslokaler/929_19d0ceeb-5f46-4c41-bf7a-158a5f5e085e.avif`, alt: "Moderne festsal" },
        { url: `${BASE_PATH}/Selskapslokaler/Sjømagasinet_June+2020_Kyle+Meyr_LR0016.webp`, alt: "Sjømagasinet selskapslokale" },
        { url: `${BASE_PATH}/Selskapslokaler/090323-Trondheim Spektrum-Main-0023.jpg.webp`, alt: "Trondheim Spektrum" },
        { url: `${BASE_PATH}/Selskapslokaler/090323-Trondheim Spektrum-Main-0027.jpg.webp`, alt: "Spektrum festsal" },
    ],

    MOTEROM: [
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_1d1_a.webp`, alt: "Moderne møterom" },
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_u1c6.webp`, alt: "Møterom med utstyr" },
        { url: `${BASE_PATH}/Møterom og kursrom/møterom-magnus-web_1.webp`, alt: "Profesjonelt møterom" },
        { url: `${BASE_PATH}/Møterom og kursrom/møterom-matt-web_3.webp`, alt: "Lyst møterom" },
        { url: `${BASE_PATH}/Møterom og kursrom/691bbcd6c2b9e4be057ff8e5_Pipervika.webp`, alt: "Møterom Pipervika" },
        { url: `${BASE_PATH}/Møterom og kursrom/IMG_3107.jpg`, alt: "Kursrom" },
        { url: `${BASE_PATH}/Møterom og kursrom/Møterom-1_4dd9e0.jpg`, alt: "Møterom type 1" },
        { url: `${BASE_PATH}/Møterom og kursrom/andreas-tangen (1).jpg`, alt: "Andreas Tangen møterom" },
        { url: `${BASE_PATH}/Møterom og kursrom/IMG20231024145510_31d736.jpg`, alt: "Moderne kursrom" },
        { url: `${BASE_PATH}/Møterom og kursrom/2020-deichman-foto-joerg-wiesner-DSC0492-H-9071822- Foto_Jörg_Wiesner.jpg`, alt: "Deichman møterom" },
        { url: `${BASE_PATH}/Møterom og kursrom/49163_153896_377661_R.jpg`, alt: "Konferanserom" },
        { url: `${BASE_PATH}/Møterom og kursrom/6852bd2137b6a42466a42f27_Biblioteket_sentralen_oslo_foto_katrine_lunke_20256.jpg`, alt: "Sentralen møterom" },
        { url: `${BASE_PATH}/Møterom og kursrom/RKH-innendors-scaled.jpg`, alt: "RKH møterom" },
    ],

    GYMSAL: [
        { url: `${BASE_PATH}/Gymsal/Gymsal.webp`, alt: "Gymsal" },
        { url: `${BASE_PATH}/Gymsal/Gymsal og idrettshall.jpg`, alt: "Gymsal og idrettshall" },
        { url: `${BASE_PATH}/Gymsal/IMG_3331+Gymsal.jpeg`, alt: "Stor gymsal" },
        { url: `${BASE_PATH}/Gymsal/Vikasen-skole-gymsal-Carl-Erik-Eriksson-scaled.jpg`, alt: "Skolegymsal" },
        { url: `${BASE_PATH}/Gymsal/unisport-as-VGS-Flerbrukshall-7.jpg`, alt: "Flerbrukshall" },
        { url: `${BASE_PATH}/Gymsal/Trosvikhallen_ERHA-7898.jpg`, alt: "Idrettshall" },
        { url: `${BASE_PATH}/Gymsal/20221116_102442.jpg`, alt: "Moderne gymsal" },
        { url: `${BASE_PATH}/Gymsal/20250408_160646.jpg`, alt: "Gymsal 2025" },
        { url: `${BASE_PATH}/Gymsal/polar-27-scaled.jpg`, alt: "Polar gymsal" },
        { url: `${BASE_PATH}/Gymsal/Apning26-1200x900.jpg`, alt: "Ny gymsal åpning" },
        { url: `${BASE_PATH}/Gymsal/44660_edited.jpg`, alt: "Redigert gymsal" },
        { url: `${BASE_PATH}/Gymsal/4f9c3335d0754df7915daffd407cb736.jpg`, alt: "Gymsal interiør" },
        { url: `${BASE_PATH}/Gymsal/_jfu7171__fullskjerm.jpg`, alt: "Gymsal fullskjerm" },
        { url: `${BASE_PATH}/Gymsal/img-20210322-125409.jpg`, alt: "Gymsal 2021" },
    ],

    KULTURARENA: [
        { url: `${BASE_PATH}/Kulturhus/storesal_fra_scenen_erika_hebbert_16_9_krympet.webp`, alt: "Kulturhus storsal" },
        { url: `${BASE_PATH}/Kulturhus/scene_7_1.jpg`, alt: "Scene i kulturhus" },
        { url: `${BASE_PATH}/Kulturhus/arendal-kulturhus9500.jpg`, alt: "Arendal kulturhus" },
        { url: `${BASE_PATH}/Kulturhus/Sal-2.jpg`, alt: "Konsertsal" },
        { url: `${BASE_PATH}/Kulturhus/kulturhuset-Highasakite-aa.jpg`, alt: "Konsert i kulturhus" },
        { url: `${BASE_PATH}/Kulturhus/oppsett-3.jpg`, alt: "Teateroppsett" },
        { url: `${BASE_PATH}/Kulturhus/SAL.jpg`, alt: "Storsal" },
        { url: `${BASE_PATH}/Kulturhus/storsalen-bolgen-kulturhus_1280-x-720.jpg`, alt: "Bølgen kulturhus" },
        { url: `${BASE_PATH}/Kulturhus/IMG_8135.jpg`, alt: "Kulturhus scene" },
        { url: `${BASE_PATH}/Kulturhus/Karmøy kulturhus - Storsal 3_974ed6.jpg`, alt: "Karmøy kulturhus" },
        { url: `${BASE_PATH}/Kulturhus/inngangopplyst_erikahebbert-min.jpg`, alt: "Kulturhus inngang" },
        { url: `${BASE_PATH}/Kulturhus/613b8485-8648-4d41-9366-bea49f0f66c2.jpeg`, alt: "Kulturarena" },
        { url: `${BASE_PATH}/Kulturhus/332118202_725669565875619_2135056254352325417_n.webp`, alt: "Kulturhus event" },
    ],

    KONFERANSEROM: [
        { url: `${BASE_PATH}/Møterom og kursrom/RKH-innendors-scaled.jpg`, alt: "Konferanserom" },
        { url: `${BASE_PATH}/Møterom og kursrom/49163_153896_377661_R.jpg`, alt: "Stort konferanserom" },
        { url: `${BASE_PATH}/Møterom og kursrom/andreas-tangen (1).jpg`, alt: "Moderne konferanserom" },
        { url: `${BASE_PATH}/Selskapslokaler/Kursrom-Himmel-og-HavWordpress-scaled.jpg`, alt: "Kursrom Himmel og Hav" },
        { url: `${BASE_PATH}/Møterom og kursrom/6852bd2137b6a42466a42f27_Biblioteket_sentralen_oslo_foto_katrine_lunke_20256.jpg`, alt: "Sentralen konferanserom" },
        { url: `${BASE_PATH}/Møterom og kursrom/IMG20231024145510_31d736.jpg`, alt: "Profesjonelt konferanserom" },
        { url: `${BASE_PATH}/Selskapslokaler/66d0431ff9a8fa50aa016de5_direktørrommet-sentralen-oslo-foto-katrine-lunke (40).jpg`, alt: "Direktørrommet Sentralen" },
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_1d1_a.webp`, alt: "Konferanserom 1D1" },
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_u1c6.webp`, alt: "Konferanserom U1C6" },
    ],

    // ===== SPORT =====

    PADEL: [
        { url: `${BASE_PATH}/Idrettshaller/A-Sport-padelbaner-1430px.jpg`, alt: "Padelbane A-Sport" },
        { url: `${BASE_PATH}/Idrettshaller/norsk-padel-leverandoer-padegalis-padelbaner-2.jpg`, alt: "Padegalis padelbaner" },
        { url: `${BASE_PATH}/Idrettshaller/padelhall-1-1200x675.jpg`, alt: "Padelhall" },
        { url: `${BASE_PATH}/Idrettshaller/3TSluppen_3.jpg`, alt: "Sluppen padelbane" },
        { url: `${BASE_PATH}/Idrettshaller/hero.avif`, alt: "Padel hero" },
        { url: `${BASE_PATH}/Idrettshaller/231769_97c2dae91e614220a987eff0185d0c4d~mv2.avif`, alt: "Moderne padelhall" },
        { url: `${BASE_PATH}/Idrettshaller/20251010172445fe1f1.webp`, alt: "Padel 2025" },
        { url: `${BASE_PATH}/Idrettshaller/Blaker.jpeg`, alt: "Blaker padel" },
        { url: `${BASE_PATH}/Idrettshaller/ceef422d58d849c0933e29b408ee2bd1.jpg`, alt: "Innendørs padel" },
    ],

    SQUASH: [
        { url: `${BASE_PATH}/Idrettshaller/Gallery_3.jpg`, alt: "Squashbane gallery" },
        { url: `${BASE_PATH}/Idrettshaller/NFS_Idrettsbygg_Hallen_04.jpg`, alt: "NFS squashhall" },
        { url: `${BASE_PATH}/Idrettshaller/Lusail_sports_Arena,_interior1.jpg`, alt: "Lusail sportshall" },
        { url: `${BASE_PATH}/Idrettshaller/USF_19-scaled-e1755845730989.jpeg`, alt: "USF squash" },
        { url: `${BASE_PATH}/Idrettshaller/maxresdefault.jpg`, alt: "Squash maxres" },
        { url: `${BASE_PATH}/Idrettshaller/nymark2.jpg`, alt: "Nymark squash" },
    ],

    TENNIS: [
        { url: `${BASE_PATH}/Idrettshaller/Tennisbane.webp`, alt: "Tennisbane" },
        { url: `${BASE_PATH}/Idrettshaller/kunstgraesbane-tennis-kit-safefloor.w1200.webp`, alt: "Tennis kunstgress" },
        { url: `${BASE_PATH}/Idrettshaller/Lade_idrettspark.png`, alt: "Lade idrettspark tennis" },
        { url: `${BASE_PATH}/Idrettshaller/Hellemyr kunstgressbane og Hellemyrhallen_954b95.jpg`, alt: "Hellemyr tennis" },
        { url: `${BASE_PATH}/Idrettshaller/Ormelet-kunstgressbane-frittfallfoto.no_20250515-611-615_2025-05-27-125110_enna.jpeg`, alt: "Ormelet tennis" },
    ],

    CAGEBALL: [
        { url: `${BASE_PATH}/Idrettshaller/offlines_1759237521224-36381a6d-28ca-4c95-b587-9e025923e74f-cageball.jpg`, alt: "Cageballbane" },
        { url: `${BASE_PATH}/Idrettshaller/baner3_16x9__fullskjerm.jpg`, alt: "Cageball fullskjerm" },
        { url: `${BASE_PATH}/Idrettshaller/DJI_0062_0.jpg`, alt: "Cageball drone" },
        { url: `${BASE_PATH}/Idrettshaller/DJI_0062_0 (1).jpg`, alt: "Cageball luftfoto" },
        { url: `${BASE_PATH}/Idrettshaller/C9F9AD74-B90D-48BE-9374-7EA324F15DB2-1024x768.jpeg`, alt: "Cageball hall" },
        { url: `${BASE_PATH}/Idrettshaller/djı_0212.jpg`, alt: "Cageball anlegg" },
        { url: `${BASE_PATH}/Idrettshaller/7a8c64f0-02d8-4eba-a73d-25a02c2af0ff.jpeg`, alt: "Innendørs cageball" },
        { url: `${BASE_PATH}/Idrettshaller/03da9a60-2306-45e8-bf8c-bacacccc24a5.jpeg`, alt: "Cageball arena" },
        { url: `${BASE_PATH}/Idrettshaller/16d2d5b6-d410-4f38-975c-e29a00f2285c.jpeg`, alt: "Cageball moderne" },
        { url: `${BASE_PATH}/Idrettshaller/a1e7c8ca-588e-48fd-bc8c-3f956913fc13.jpeg`, alt: "Cageball center" },
    ],

    BADMINTON: [
        { url: `${BASE_PATH}/Idrettshaller/Ullern-flerbrukshall_01.jpg`, alt: "Ullern badmintonhall" },
        { url: `${BASE_PATH}/Idrettshaller/Ullern-flerbrukshall_02.jpg`, alt: "Ullern badmintonbaner" },
        { url: `${BASE_PATH}/Idrettshaller/Haakonsvern-MTA_Ivan-Brodey_0029-2560x1701.webp`, alt: "Haakonsvern badminton" },
        { url: `${BASE_PATH}/Gymsal/unisport-as-VGS-Flerbrukshall-7.jpg`, alt: "Flerbrukshall badminton" },
    ],

    // ===== ARRANGEMENTER =====

    KURS: [
        { url: `${BASE_PATH}/Møterom og kursrom/RKH-innendors-scaled.jpg`, alt: "Kursrom RKH" },
        { url: `${BASE_PATH}/Møterom og kursrom/6852bd2137b6a42466a42f27_Biblioteket_sentralen_oslo_foto_katrine_lunke_20256.jpg`, alt: "Kurslokale Sentralen" },
        { url: `${BASE_PATH}/Møterom og kursrom/IMG_3107.jpg`, alt: "Kursrom moderne" },
        { url: `${BASE_PATH}/Selskapslokaler/Kursrom-Himmel-og-HavWordpress-scaled.jpg`, alt: "Kursrom Himmel og Hav" },
    ],

    WORKSHOP: [
        { url: `${BASE_PATH}/Møterom og kursrom/IMG20231024145510_31d736.jpg`, alt: "Workshop-rom" },
        { url: `${BASE_PATH}/Møterom og kursrom/2020-deichman-foto-joerg-wiesner-DSC0492-H-9071822- Foto_Jörg_Wiesner.jpg`, alt: "Kreativt rom Deichman" },
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_1d1_a.webp`, alt: "Workshop rom 1" },
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_u1c6.webp`, alt: "Workshop rom 2" },
        { url: `${BASE_PATH}/Møterom og kursrom/møterom-magnus-web_1.webp`, alt: "Workshop Magnus" },
        { url: `${BASE_PATH}/Møterom og kursrom/møterom-matt-web_3.webp`, alt: "Workshop Matt" },
        { url: `${BASE_PATH}/Møterom og kursrom/691bbcd6c2b9e4be057ff8e5_Pipervika.webp`, alt: "Workshop Pipervika" },
        { url: `${BASE_PATH}/Møterom og kursrom/Møterom-1_4dd9e0.jpg`, alt: "Workshop lokale" },
    ],

    SEMINAR: [
        { url: `${BASE_PATH}/Kulturhus/SAL.jpg`, alt: "Seminarsal" },
        { url: `${BASE_PATH}/Kulturhus/storsalen-bolgen-kulturhus_1280-x-720.jpg`, alt: "Bølgen seminarsal" },
        { url: `${BASE_PATH}/Kulturhus/storesal_fra_scenen_erika_hebbert_16_9_krympet.webp`, alt: "Storsal seminar" },
        { url: `${BASE_PATH}/Kulturhus/arendal-kulturhus9500.jpg`, alt: "Arendal seminar" },
        { url: `${BASE_PATH}/Kulturhus/Sal-2.jpg`, alt: "Seminarsal 2" },
        { url: `${BASE_PATH}/Kulturhus/Karmøy kulturhus - Storsal 3_974ed6.jpg`, alt: "Karmøy seminar" },
        { url: `${BASE_PATH}/Kulturhus/IMG_8135.jpg`, alt: "Seminar scene" },
        { url: `${BASE_PATH}/Møterom og kursrom/49163_153896_377661_R.jpg`, alt: "Seminar auditorium" },
        { url: `${BASE_PATH}/Møterom og kursrom/RKH-innendors-scaled.jpg`, alt: "RKH seminar" },
        { url: `${BASE_PATH}/Kulturhus/613b8485-8648-4d41-9366-bea49f0f66c2.jpeg`, alt: "Kulturhus seminar" },
    ],

    KONSERT: [
        { url: `${BASE_PATH}/Kulturhus/kulturhuset-Highasakite-aa.jpg`, alt: "Konsertscene Highasakite" },
        { url: `${BASE_PATH}/Kulturhus/scene_7_1.jpg`, alt: "Konsertsal scene" },
        { url: `${BASE_PATH}/Kulturhus/oppsett-3.jpg`, alt: "Konsert oppsett" },
        { url: `${BASE_PATH}/Kulturhus/storesal_fra_scenen_erika_hebbert_16_9_krympet.webp`, alt: "Konsertsal storsal" },
    ],

    FOREDRAG: [
        { url: `${BASE_PATH}/Kulturhus/oppsett-3.jpg`, alt: "Foredragssal" },
        { url: `${BASE_PATH}/Møterom og kursrom/49163_153896_377661_R.jpg`, alt: "Auditorium foredrag" },
        { url: `${BASE_PATH}/Kulturhus/SAL.jpg`, alt: "Foredrag storsal" },
        { url: `${BASE_PATH}/Kulturhus/storsalen-bolgen-kulturhus_1280-x-720.jpg`, alt: "Bølgen foredrag" },
    ],

    // ===== TORGET (UTSTYR) =====

    TELT: [
        { url: `${BASE_PATH}/utstyr/leietelt_stor.jpg`, alt: "Leietelt stort" },
        { url: `${BASE_PATH}/utstyr/4x8-med-3-vegger.jpg`, alt: "Telt 4x8 med vegger" },
        { url: `${BASE_PATH}/utstyr/alpint-1-1920x1080.jpg`, alt: "Alpint telt" },
        { url: `${BASE_PATH}/utstyr/truger-snowshoe-1200x675.jpg`, alt: "Vintertelt" },
    ],

    PARTYTELT: [
        { url: `${BASE_PATH}/utstyr/leietelt_stor.jpg`, alt: "Stort partytelt" },
        { url: `${BASE_PATH}/Selskapslokaler/Utleiepartner-telt-bord-og-benker.jpg`, alt: "Partytelt med møbler" },
        { url: `${BASE_PATH}/utstyr/4x8-med-3-vegger.jpg`, alt: "Partytelt 4x8" },
        { url: `${BASE_PATH}/Selskapslokaler/2+(49).webp`, alt: "Festtelt" },
    ],

    LYDANLEGG: [
        { url: `${BASE_PATH}/utstyr/utstyr07.jpeg`, alt: "Lydanlegg komplett" },
        { url: `${BASE_PATH}/utstyr/ec0199_1920_1280_1718534386.webp`, alt: "Profesjonelt lydanlegg" },
        { url: `${BASE_PATH}/Kulturhus/scene_7_1.jpg`, alt: "Scene med lydanlegg" },
        { url: `${BASE_PATH}/Kulturhus/kulturhuset-Highasakite-aa.jpg`, alt: "Konsert lydanlegg" },
    ],

    PROJEKTOR: [
        { url: `${BASE_PATH}/utstyr/w1200h1200-3.jpg`, alt: "Projektor HD" },
        { url: `${BASE_PATH}/Møterom og kursrom/moterom_1d1_a.webp`, alt: "Møterom med projektor" },
        { url: `${BASE_PATH}/Møterom og kursrom/RKH-innendors-scaled.jpg`, alt: "Konferanserom projektor" },
        { url: `${BASE_PATH}/Møterom og kursrom/49163_153896_377661_R.jpg`, alt: "Auditorium projektor" },
    ],

    BORD_OG_STOLER: [
        { url: `${BASE_PATH}/utstyr/28cbf6_klappbord-med-stoler-tilgjengelig-for-leie.jpg`, alt: "Klappbord med stoler" },
        { url: `${BASE_PATH}/utstyr/Utleie-av-bryllupsstoler-1280.jpg`, alt: "Bryllupsstoler" },
        { url: `${BASE_PATH}/utstyr/svart-klappstol-uten-pute-mai-2025-1.jpeg`, alt: "Svart klappstol" },
        { url: `${BASE_PATH}/Selskapslokaler/Utleiepartner-telt-bord-og-benker.jpg`, alt: "Bord og benker utleie" },
    ],

    GRILL: [
        { url: `${BASE_PATH}/utstyr/catering-oslo-scaled.jpg`, alt: "Grill og catering" },
        { url: `${BASE_PATH}/Selskapslokaler/catering.jpg`, alt: "Grillcatering" },
        { url: `${BASE_PATH}/Selskapslokaler/mat-1.jpg`, alt: "Grill mat" },
        { url: `${BASE_PATH}/utstyr/Infra-Anlegg-Cat-374-772G-LoRes-1320x790.jpg`, alt: "Stort grillanlegg" },
    ],
};

/**
 * Get images for a subcategory, ensuring uniqueness per resource
 * Uses a deterministic offset based on resourceIndex to avoid duplicates
 */
export function getImagesForSubcategory(subcategoryKey: string, resourceIndex: number, count: number = 3): ImageDefinition[] {
    const images = IMAGES[subcategoryKey as keyof typeof IMAGES] || IMAGES.MOTEROM;
    const result: ImageDefinition[] = [];

    // Use prime number offset to spread images more evenly
    const primeOffset = 7;
    const startIndex = (resourceIndex * primeOffset) % images.length;

    for (let i = 0; i < count; i++) {
        const imgIndex = (startIndex + i) % images.length;
        result.push({
            ...images[imgIndex],
            isPrimary: i === 0,
        });
    }

    return result;
}

export function getRandomImage(subcategoryKey: string): ImageDefinition {
    const images = IMAGES[subcategoryKey as keyof typeof IMAGES] || IMAGES.MOTEROM;
    const randomIndex = Math.floor(Math.random() * images.length);
    return { ...images[randomIndex], isPrimary: true };
}
