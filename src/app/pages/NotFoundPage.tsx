import { useNavigate } from "react-router-dom"

import Button from "../../components/ui/Button"
import EmptyState from "../../components/ui/EmptyState"
import Icon from "../../components/ui/Icon"
import { useTranslation } from "../../i18n/I18nProvider"

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex justify-center py-16">
      <EmptyState
        title={t("notFound.title")}
        description={t("notFound.subtitle")}
        icon={<Icon name="search" size={30} />}
        action={
          <Button variant="primary" onClick={() => navigate("/")}>
            {t("notFound.backHome")}
          </Button>
        }
      />
    </div>
  )
}
