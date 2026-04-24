export const videos = [
    {
        id: 1,
        thumbnail:
            "https://res.cloudinary.com/ducxigdil/image/upload/v1739470989/image_vfqft9.png",
        youtubeId: "wDchsz8nmbo",
    },
    {
        id: 2,
        thumbnail:
            "https://res.cloudinary.com/ducxigdil/image/upload/v1739470989/Screenshot_2025-02-11_150144_jbyebe.png",
        youtubeId: "K4TOrB7at0Y",
    },
    {
        id: 3,
        thumbnail:
            "https://res.cloudinary.com/ducxigdil/image/upload/v1739470989/Screenshot_2025-02-11_152722_i57der.png",
        youtubeId: "Qra4ri7UzvM",
    },
    {
        id: 4,
        thumbnail:
            "https://res.cloudinary.com/ducxigdil/image/upload/v1739470991/Screenshot_2025-02-11_152543_kvpd4d.png",
        youtubeId: "wDchsz8nmbo",
    },
    {
        id: 5,
        thumbnail:
            "https://res.cloudinary.com/ducxigdil/image/upload/v1739470991/Screenshot_2025-02-11_150236_s9vlrd.png",
        youtubeId: "K4TOrB7at0Y",
    },
    {
        id: 6,
        thumbnail:
            "https://res.cloudinary.com/ducxigdil/image/upload/v1739470992/Screenshot_2025-02-11_150215_ltvzvz.png",
        youtubeId: "Qra4ri7UzvM",
    },
]

export const faqItems = [
    {
        question: "What is Griot and Grits?",
        answer:
        "Griot and Grits is an open source project founded by Ty McDuffie, aimed at preserving Black stories one voice at a time. This initiative blends technology and cultural heritage to create a platform for digital storytelling within the Black community.",
    },
    {
        question: "Who is involved in Griot and Grits?",
        answer:
        `Griot and Grits is a collaboration between Red Hat's Black United in Leadership and Diversity (B.U.I.L.D.) organization, historians, leaders in the African American community, universities and the Mass Open Cloud.`,
    },
    {
        question: "What are the goals of the project?",
        answer:
        "The primary goal of Griot and Grits is to preserve and celebrate the rich narratives and experiences of the Black community through digital storytelling. The initiative aims to empower individuals to share their unique stories and ensure these voices are captured for future generations.",
    },
    {
        question: "How does the project use technology?",
        answer:
        "Griot and Grits leverages Red Hat OpenShift AI running in the Mass Open Cloud infrastructure to accelerate the creation of AI tools that enrich the stories from Black families. The project also utilizes important public Black history archives to train AI models and enhance the stories captured.",
    },
    {
        question: "How can I get involved?",
        answer:
        "Volunteers and contributors are essential to the success of Griot and Grits. To get involved, visit  or join the project on https://github.com/griot-and-grits/griot-and-grits. Your participation will help bring this vision to life and support the preservation of Black stories.",
    },
    {
        question: "When will the stories be available?",
        answer:
        `The community is dedicated to making the stories captured publicly accessible in the upcoming months. Stay tuned for updates on our https://www.griotandgrits.org/ and https://github.com/griot-and-grits/griot-and-grits repository.`,
    },
    {
        question: "Who can I contact for more information?",
        answer:
        "For more information regarding the Griot and Grits initiative, please visit github.com/griot-and-grits or contact us via email at info@griotandgrits.org.",
    },
]

export interface Testimonial {
    id: number
    content: string
    author: string
    position: string
    avatarUrl: string
}

export const testimonials: Testimonial[] = [
{
    id: 1,
    content:
    "It's truly inspiring to collaborate with individuals who are deeply passionate about making history by preserving the past and harnessing AI to bring these stories to life in innovative and meaningful ways.",
    author: "Demethria Ramseur",
    position: "Principal Agilist",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739470053/unnamed_2_hioho1.png",
},
{
    id: 2,
    content:
    "Working on this project is like playing in the All-Star game. Surrounded by brilliance, driven by shared passion, and inspired by a team that reflects the diversity of our culture. We're creating something truly exceptional; something that can impact not just a culture, but all its people.  I am honored to be a part of Griot and Grits.",
    author: "Sidney Hargrove",
    position: "Associate Director, Clinical Systems & Metrics",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739470053/unnamed_1_fnwr24.png",
},
{
    id: 3,
    content:
    "Preserving our community stories is something that has been on my mind a lot lately.   I am so grateful to be able to work on a project that is collecting, organizing, enhancing and sharing our story in a way not seen before. Working on this project has been a joy.  I look forward to all of the great things we can accomplish in the future.",
    author: "Albert Myles",
    position: "Manager, Knowledge Management",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739470054/image_1_yonrgl.png",
},
{
    id: 4,
    content:
    "This project is an opportunity to honor the contributions, resilience, and brilliance of those who came before us while also creating something that will educate and inspire future generations. Personally, Black history is a vital part of my identity and legacy, and professionally, it aligns with my passion for storytelling, empowerment, and ensuring that important narratives are preserved and shared.  I'm grateful to contribute to this project and to collaborate with others who are equally passionate about making an impact on preserving our history. We are our ancestors' wildest dreams.",
    author: "Koren Townsend",
    position: "Sr. Project Manager",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739470056/image_fygbiz.png",
},
{
    id: 5,
    content:
    "An increasing challenge that black families face is the further we are from the struggles of our ancestors, the harder it is to acknowledge that the struggle ever existed.  Using AI to blend rich historical archives together with oral history will bring new life to these amazing stories.  It's important we teach future generations about these struggles in ways that are relatable, educational and heart-felt.",
    author: "Ty McDuffie",
    position: "Founder",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739470053/unnamed_zovuhs.png",
},
{
    id: 6,
    content:
    "Through Griot and Grits, we are taking a significant step towards ensuring that the voices and stories of the Black community are preserved.  We have an aging generation that lived through segregation, fought for equal rights, and witnessed a man step foot on the moon.  It's critically important that families capture those stories before they are lost forever, and AI is helping us do just that for them.",
    author: "Sherard Griffin",
    position: "Senior Director, OpenShift AI Engineering",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739473412/Picture1_w1clj2.png",
},
{
    id: 7,
    content:
    "Griot and Grits is a wonderful way to create family memories and share the amazing history of our country through the telling of the stories of our lives. I am excited about how this will open up our history to those generations to come after us in the tradition of the griot - sharing the important happenings of the family and tribe for all to celebrate down through the ages.",
    author: "Carmen Cauthen",
    position: "Historian of African American history and Author",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739473410/Picture2_pzzbzn.png",
},
{
    id: 8,
    content:
    " The idea of bringing my family's past to life via the Griot and Grits project is incredible—one that ensures future generations will know their roots. AI doesn't replace storytelling; it enhances it, making history more vivid, accessible, and meaningful than ever before.",
    author: "Sonja Matheny",
    position: "Sr Program Manager",
    avatarUrl: "https://res.cloudinary.com/ducxigdil/image/upload/v1739711234/unnamed_3_f48v7o.png",
},
]

export type LLMProvider = 'ollama' | 'vllm' | 'llamacpp' | 'openshift-ai';

export interface GriotConfig {
    llm: {
        provider: LLMProvider;
        baseUrl: string;
        model: string;
        timeout: number;
        apiKey?: string;
        headers?: Record<string, string>;
    };
    context: {
        filePath: string;
        maxTokens: number;
    };
}

export const griotConfig: GriotConfig = {
    llm: {
        provider: (process.env.NEXT_PUBLIC_LLM_PROVIDER as LLMProvider) || 'ollama',
        baseUrl: process.env.NEXT_PUBLIC_LLM_BASE_URL || 'http://localhost:11434',
        model: process.env.NEXT_PUBLIC_LLM_MODEL || 'llama3.2:1b',
        timeout: parseInt(process.env.NEXT_PUBLIC_LLM_TIMEOUT || '120000'),
        apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY,
        headers: process.env.NEXT_PUBLIC_LLM_HEADERS ? JSON.parse(process.env.NEXT_PUBLIC_LLM_HEADERS) : undefined,
    },
    context: {
        filePath: '/griot-context.txt',
        maxTokens: parseInt(process.env.NEXT_PUBLIC_CONTEXT_MAX_TOKENS || '4000'),
    },
}

// GoFundMe OAuth configuration
export const GOFUNDME_CLIENT_ID = process.env.GOFUNDME_CLIENT_ID || 'client_id';
export const GOFUNDME_CLIENT_SECRET = process.env.GOFUNDME_CLIENT_SECRET || 'client_secret';
export const GOFUNDME_REDIRECT_URI = process.env.GOFUNDME_REDIRECT_URI || 'http://localhost:3000/oauth/callback';
