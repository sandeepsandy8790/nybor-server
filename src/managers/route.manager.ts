/** THIS FILE IS AUTOGENERATED BY ROUTE CONFIG PLUGIN
EDIITNG IS NOT RECCOMMENDED AND EVEN IF YOU EDIT NOTHING HAPPENS.
THE NEXT BUILD WOULD OVERWRITE IT */

import { AdminRoutes as Route0 } from '@routes/admin-protected/admin.api'
import { KycRoutes as Route1 } from '@routes/admin-protected/kyc.api'
import { TribeRoutes as Route2 } from '@routes/admin-protected/tribe.api'
import { AadharRoutes as Route3 } from '@routes/public-open/aadhar.api'

export class RouteManager
{
  public static CreateRouter(router){

      Route0.create(router);
      Route1.create(router);
      Route2.create(router);
      Route3.create(router);

} 
 }