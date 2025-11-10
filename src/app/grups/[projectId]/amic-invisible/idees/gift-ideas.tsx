import { InfoIcon } from "lucide-react";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GiftIdeas({
  giftIdeas,
}: {
  giftIdeas: GiftIdeaData[];
  secretSantaId: string;
}) {
  return (
    <>
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Informació</AlertTitle>
        <AlertDescription>
          <p>
            {
              "Aquesta és una llista d'idees que només podrà veure el teu amic invisible com a inspiració."
            }
          </p>
        </AlertDescription>
      </Alert>

      {giftIdeas.length > 0 ? (
        <ul>
          {giftIdeas.map((giftIdea, index) => (
            <li key={`${index}-${giftIdea.name}`}>
              <div>
                <h3>{giftIdea.name}</h3>
                <p>{giftIdea.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground italic">
          {"Encara no has afegit cap idea, se t'acudeix alguna cosa?"}
        </p>
      )}
    </>
  );
}
