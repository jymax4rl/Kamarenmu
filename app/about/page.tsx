import Image from "next/image";
import Link from "next/link";
import {
  getAdministrators,
  getPresidentsList,
} from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { TeamSection } from "@/components/about/TeamSection";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { President } from "@/types";
import {
  BsFacebook,
  BsInstagram,
  BsTwitterX,
} from "react-icons/bs";

function SocialLinks({ president }: { president: President }) {
  const s = president.socialLinks;
  if (!s?.facebook && !s?.twitter && !s?.instagram) return null;
  return (
    <div className="flex gap-3 pt-3">
      {s.facebook && (
        <a
          href={s.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-amber-100 p-3 text-amber-800 hover:bg-amber-200 transition"
          aria-label="Facebook"
        >
          <BsFacebook className="text-lg" />
        </a>
      )}
      {s.twitter && (
        <a
          href={s.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-amber-100 p-3 text-amber-800 hover:bg-amber-200 transition"
          aria-label="Twitter"
        >
          <BsTwitterX className="text-lg" />
        </a>
      )}
      {s.instagram && (
        <a
          href={s.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-amber-100 p-3 text-amber-800 hover:bg-amber-200 transition"
          aria-label="Instagram"
        >
          <BsInstagram className="text-lg" />
        </a>
      )}
    </div>
  );
}

export default async function AboutPage() {
  const [presidentsData, adminsData] = await Promise.all([
    getPresidentsList(10),
    getAdministrators(),
  ]);

  const presidents = presidentsData?.items ?? [];
  const current =
    presidents.find((p) => p.isCurrent) ?? presidents[0] ?? null;
  const admins =
    adminsData?.items?.filter((a) => a.isActive).sort((a, b) => a.order - b.order) ??
    [];

  return (
    <div className="space-y-8 pb-6">
      <section className="space-y-3 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">About Us</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Kama Renmu Jikke is a volunteer-led initiative dedicated to
          preserving Soninke language, oral histories, and diaspora networks.
          We publish thoughtful essays, host cultural dialogues, and spotlight
          leaders who keep our heritage vivid and generous.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card className="rounded-3xl p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
            Mission
          </h2>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Equip families with accessible learning tools and dignified
            storytelling spaces rooted in Soninke values.
          </p>
        </Card>
        <Card className="rounded-3xl p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
            Vision
          </h2>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            A globally connected Soninke community confident in its language and
            generous in cultural exchange.
          </p>
        </Card>
      </section>

      {current && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 px-1">
            Presidential Office
          </h2>
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-[16/11] w-full">
              <Image
                src={current.photo}
                alt={current.fullName}
                fill
                className="object-cover rounded-t-3xl"
                sizes="100vw"
              />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>
                  {current.isCurrent ? "Current President" : "Past President"}
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {current.fullName}
              </h3>
              <p className="text-xs text-gray-500">
                Mandate: {formatDate(current.mandateStart)}
                {current.mandateEnd
                  ? ` – ${formatDate(current.mandateEnd)}`
                  : " – Present"}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-6">
                {current.biography}
              </p>
              {current.contactEmail && (
                <Link
                  href={`mailto:${current.contactEmail}`}
                  className="inline-flex text-sm font-semibold text-amber-600 hover:text-amber-700"
                >
                  Contact office
                </Link>
              )}
              <SocialLinks president={current} />
            </div>
          </Card>
        </section>
      )}

      {admins.length > 0 && <TeamSection admins={admins} />}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 px-1">Contact</h2>
        <div className="grid gap-3">
          <Card className="rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Secretariat
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              secretariat@kamarenmu.example.org
            </p>
          </Card>
          <Card className="rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Phone
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              +221 33 000 00 00
            </p>
          </Card>
        </div>
      </section>

      <footer className="pt-4 border-t border-amber-100 text-center space-y-3">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Kama Renmu Jikke. Crafted with care for
          the Soninke community.
        </p>
        <div className="flex justify-center gap-4 text-amber-700">
          <a href="#" className="hover:text-amber-900 transition" aria-label="Facebook">
            <BsFacebook className="text-xl" />
          </a>
          <a href="#" className="hover:text-amber-900 transition" aria-label="Instagram">
            <BsInstagram className="text-xl" />
          </a>
          <a href="#" className="hover:text-amber-900 transition" aria-label="Twitter">
            <BsTwitterX className="text-xl" />
          </a>
        </div>
      </footer>
    </div>
  );
}
