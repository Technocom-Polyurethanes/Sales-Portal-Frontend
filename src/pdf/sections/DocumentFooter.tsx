/**
 * Official bilingual letterhead footer, repeated at the bottom of every page.
 * Like the header it is locked to LTR: English contacts on the left, Arabic
 * contacts on the right, as on the pre-printed letterhead.
 */
export default function DocumentFooter() {
  return (
    <footer className="doc-footer" dir="ltr">
      <div className="doc-footer__letterhead">
        <div className="doc-footer__col doc-footer__col--en">
          <p className="doc-footer__address">
            5 Nahda St -Dokki - Giza - Egypt.
          </p>
          <p><span className="doc-footer__label">Mob</span> : (+2) 0100 5411 078</p>
          <p><span className="doc-footer__label">Tel</span> : (+202 ) 37615321 - 37602735 - 37602927</p>
          <p><span className="doc-footer__label">Fax</span> : (+202 ) 37609292 - 37602934</p>
        </div>

        <div className="doc-footer__col doc-footer__col--center">
          <p className="doc-footer__email">E-mail : sales@technocom.org</p>
        </div>

        <div className="doc-footer__col doc-footer__col--ar" dir="rtl">
          <p className="doc-footer__address">٥ شارع النهضة - الدقي - الجيزة</p>
          <p>موبايل : ٥٤١١٠٧٨ (٠١٠٠)</p>
          <p>تليفون : ٣٧٦٠٢٩٢٧ - ٣٧٦٠٢٧٣٥ - ٣٧٦١٥٣٢١ (٠٢)</p>
          <p>فاكس : ٣٧٦٠٢٩٣٤ - ٣٧٦٠٩٢٩٢ (٠٢)</p>
        </div>
      </div>
    </footer>
  )
}
