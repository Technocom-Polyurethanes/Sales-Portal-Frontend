import { useNavigate } from "react-router-dom"

import Button from "../../components/ui/Button"
import EmptyState from "../../components/ui/EmptyState"
import Icon from "../../components/ui/Icon"
import { useTranslation } from "../../i18n/I18nProvider"

/** Shown instead of a page the signed in role is not allowed to use. */
export default function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex justify-center py-16">
      <EmptyState
        title={t("forbidden.title")}
        description={t("forbidden.subtitle")}
        icon={<Icon name="user" size={30} />}
        action={
          <Button variant="primary" onClick={() => navigate("/")}>
            {t("notFound.backHome")}
          </Button>
        }
      />
    </div>
  )
}
