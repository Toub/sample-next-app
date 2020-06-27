import { ok } from "assert";
import { create } from "@socialgouv/kosko-charts/components/app";
import { metadataFromParams } from "@socialgouv/kosko-charts/components/app/metadata";
import env from "@kosko/env";
import { ConfigMap } from "kubernetes-models/v1/ConfigMap";
import { SealedSecret } from "@kubernetes-models/sealed-secrets/bitnami.com/v1alpha1/SealedSecret";

const params = env.component("app");
const { deployment, ingress, service } = create(params);

//
ok(process.env.CI_ENVIRONMENT_NAME);
if (
  process.env.CI_ENVIRONMENT_NAME.endsWith("-dev") ||
  process.env.CI_ENVIRONMENT_NAME.endsWith("prod")
) {
  // HACK(douglasduteil): our cluster v1 is not supporting the `startupProbe`
  // Our cluster v1 is stuck in k8s v1.14 :(
  delete deployment.spec!.template.spec!.containers[0].startupProbe;
}

//

const envConfigMap = new ConfigMap({
  metadata: {
    ...metadataFromParams(params),
    name: `${params.name}-env`,
  },
  data: {
    NODE_ENV: process.env.NODE_ENV || "production",
    FRONTEND_HOST: "${HOST}", // todo: for emails ?
    GRAPHQL_ENDPOINT: "http://hasura/v1/graphql",
    ACCOUNT_MAIL_SENDER: "contact@fabrique.social.gouv.fr",
    FRONTEND_PORT: "${PORT}",
    PRODUCTION: "false", // todo: override in prod
  },
});

const secret = new SealedSecret({
  metadata: {
    ...metadataFromParams(params),
    name: `${params.name}-env`,
  },
  spec: {
    encryptedData: {
      ACCOUNT_EMAIL_SECRET:
        "AgCYU5zQRAGub/7BY2VzhhQ/Y5EtYeWcgdBrHMfOdhK6DLDbkiYTVBvdIVbvUp/AtHP8V3UwT0zoQfKRiECwdH6oJ92GJ2DQ6svTNJH+x4EyQRJTeRMOrx6y+iVAcFx6I5RbT6SdKkpzGztpY4t4pGt3IOUoKNrJRqshj170LQqsw57NyxzSgZ0HONNsHE+HUK6AijgZXBthAfWqlFyrg6WIBY1f/jyuZ7jvzlotTI9JXXSBz8LryNYG7kth2weHcmlQKiqERPbWGFuGwM77hzgFwixjqnrGJEjWXDfsAmBLk+B9nVht2H54pPYCD+cyRea5NeisxnNCAOw10BJHEX1gxgNzSwQDVfOSINWT1a8R81tm7Dz7j3LyKKT+UH8BREHMlu4qv7+D6PjrRXJXtAMGN6Vsz0Hqvf6vlZou7O4ygcAtirRaSPvsuU1FOg2JvwfheUVZ7StBGhsTBWyQ0jw9UqAXcjtcbqfzeOc8sEEe/5xyRJctT+A4s4XNGxiF/Mnaa9XB5OHtz55FUDzy2o0S21JXFjnNs2kmDji3gjPwYJzg+qat7ZcGBNMR4KNvu2SiUoDdQMKzmh7mi4nwqlOv08eJVP8ZzXGS3F8QcsMFXPfrH/53hunKq6gQ61D3+CsCN6Hz89X7FgWnMroMv52gNwtUc0yeQ+klIB2RsY6+NefWx0p+ikxHY9MG64qMPtFNG+RW2TwRgcdbD6CC31GUVmGVLpEF95RF7v1i66H9EvNwiRZCagnZ4qYcrQ==",
      HASURA_GRAPHQL_ADMIN_SECRET:
        "AgCAqhKgc3PtqkQnkPeR0pAyh5bkICHiNpYkHBwRAhRCSo4kktC4p1/OJapMewk2glYBZHdUIad4JEn1V7/EvfMkWs7Eh7CXLYQB8xdJxbl7tyopNSppQxLA2YkMTPmnja5kGJrf2nvZNR1u7aQ7z5ZuP9KFzPsWTj/pFQiczsoyhNrKJmSeAUMRKophVfgKDdvNuM6ZEuSiR9iGhhrGJVD1gHlQaOW0JKCjweuC0opYdP/rlZOD6BvqzlaYc+dHVYbot7ktDzYT98YCIJdS0sKe0/6+L/CQgWeqAUxZxyPrtOk5BsBOXKNuXIrG9sQQ8SXSykubqYRGdClVv6TlazMXvBtuoind14bkJ1G4Are0FsokIPoJxrYAM1Nd4hKvRJvT3BiiEY2JdqRbmeHyZc+yCYUeUkvbtVIHFHGnSjVzAfriR6mLj4psmUGAtjq7qqaa6fJQb1fRr6pnb6//i6B6NjspyMHNi5uwLCn3Rvrqbq0abgtZCh1PUPZeqA/kAENyg3FunPzxiCdlHJnKch7lQDSkoQDukEGWipUnr9/ICfMuAMlu1uTHqjjGrsZoewqY00MHkPNyFiHVwYmEqY9INfmEH9G5UBLaWTorLyvleJUK60d8ZteFArZlskOs82gtcVhYGtE1TZ3VSn/sGKHdC53BlWJ5b65GKP8bn1xKmuu+ah3+NNWkgTydoKzTjHxOiX3FVeDHyVM9v3Xyv/6/Z8KCvRw9cgbmcX+PkTifzsT/10iGvP+aa/8+3tOmikLHHGpTyALG9YOZ4MPOHR5owd1xI0TUm++0+JgxYfeNny+Ybk0O0x/ikVx+gSDR7MKDD9sI2V6wX8cJKpl6hLFIxFV0EUCwHiWW0N5ZnXJarMMhMWzV+4YaD0c6ZxhDgizvIX6nOs0aEihvFBVBgZuiIiO3RW0fUDel0kcqzg==",
      HASURA_GRAPHQL_JWT_SECRET:
        "AgAnThMc6uuayn1BR4rLy65IoFDsv8pzBpphbYxf36e4OJooSi9s2upWe8g3HpVfdb5SthH77uw+64Ks+Tvku1gHrUOOXh89F+RS1mLwBfNhe4Nlf55AosasYsUOjE5mWOd0Czdp723ujL9T1SoZNyGeGyG2ZPxR+clgBJIgX5fRMvfi76SSq5trUasItHflHp+io2leMD8QBB0jukLf8vmHHCZ36S1hwtISj7NMHtiv4bl2AQPj6KjyO2U0AB+Uf+Un21RwCRsXv4mDkKNZAGSMn67IkqLRK02TFJQRz4qn+WrX4DPkgNG+fELYHBK0CSi8orSN07Z0qY4y86IYbXRiqJDDKIXq6jNQ2V3Ffox8uNNPk8BJ4lrxz4Bn9r9/rTWRLS70Uzv+OXViJ2xcb4HxBZFSKucOVK4Gx8kFf5xoKd6LV6g6kbjtYQUR4FGQihvZYsDrr5qGv1rxHO7EkY4o9Hre2iHVQJ08imfDoXscfzeJC9lxo/e5M7LusDtIkzwkMkmsv8WXMlGjfg4JoYiQzVA8oMsmeWQLHNdJUdSkZF8tFc3skvgYEeMuDi89KRiuCOwnShrVLzPzYbWO+7dwnyay5NVvtvNE9kXYn5U4EwGExeLGWoRRrDCOUM9sgwAJF7AcDcQUQ+MWupWacW7YE+VjBMuDmJR+1Gx9qDXGUspG1DkDfKqLCxT1L2RoMlbIfubACEYYbZ5IiooqjwbHCMUzbr4aRNSM2C3KqN8wSlB18xVfrgVpWYqZFtXWjJAgvLbn5Pi6ryaBPy/adnlBpGf1S2EakV9uR6gdpsKR1yTmzNT7MCIiInzvq/KijQCiJwAyqIkpU+tQv+HInHxWZQ==",
      SMTP_EMAIL_PASSWORD:
        "AgAGdvTnBpg52nSwcqvGIoTRkxweutFd7x1hbU/HHAH9gxPa4ICT5AOZyb+Ec9OeaSBQjf9T+4qYGC5FngtbhqfSiloVvir2NvXZOUy+O3ME33QCzfw4+nANvHmsngFDVsJdjvSz2ykT9dyNbiyFrqRBhV5RnIAqgTfvXozVOFdFeUVRelL+tZQC0miGdHUOmjjOSh4T8LntBwJOj9lv/oW1g+Vai2zOwfSGFRTeWHv/Y5WYXCiuprOzgrYUEEzxDb/ELD45S5fcwYM4KVezHe1NAWqjPhcVwLq1q4iqSaHBwGBH528pxcFcPUn3u1uK/ip3lsPiA32vi5bFantUoBiL8HfB5NedJMls/3AeyIQl53Ymu55kr/NZ5YugXExs+uCgm3aRE8EyMWnVjvYZ2npSXS9hiTsBm0jyEHOSfdLiuWvGK5r+1zz6mHuBYemQQnLjEpmRhrG5XJyJmHAsRNR1P7H1+3pqSDD8iw0yXinth3URP/4L9JrTaI4Mx2LmDmVj34oGrbMx1Ekqe7t8MjrHy/fIXRqct7X+F+GFjklALzYNuBqNUg+HxbdVKxuo9STbUVhxTXkSvlgOaT9sUiyYFybiqj8vX9VPKhKBxrUmEPue4d63v/ud3YhyHcFENUQ7PKteBUKjzPOaMNi4xvmUi6Wk/sSCBi5BZiin0obLdUGplnmO0rzX9wxllUBS+o14T5m6kWk0b1oUesVOORk9mBR1rUPKHJWCmkFYcoqTjQ==",
      SMTP_EMAIL_USER:
        "AgCVO/tUEz52Bt2Az91fIjWN6MYoV+eHqyufJ1N1RzkzgF/sw5DRdpKR5+s9ZOJvPlsEBUoUtd+iH16ZJz/vx4oSR5+KeTg4fXyOIi+jL/AB4hBYP8cQvvC9kXvK4KiS1FXiYvXKATcusvTkHdJZf/CfYB7jyXpyvMdmefiOexjwyieIP//YqPygqgOvi7RGnqohrk2S28YW17/oJA1QatbUh84wNG/6sSAfyy7coYaSU+6gTjHdommuypMRN7QKts/Hj0ZdM8xzXjQ630NzIPjZha6gG++ZDhR2hyo+vGuUESKuE37ifeEJlBhnWr/T9Qm2xE29UDChUpmtGtFz5xoxLabk8eU32qWy3WzclX26D2Ctcl1zy8atbaHq7A5JeWrV9wowhrUMVg/uiDXbt4NTcegHwCfSXl1kqNMVtJl7HijmUBMy+Yf7ntKyhdA6AoLZFQxrypzY3lgIS+2p46Ig1CP/DXakOn7yyoRW+k1KkzKv9E18QlvaRn6coyq705brLLM3/RuISw+FwGbD/VLgiHMIpCarY+Uy+K/c28320DXvoMLopAJekUnbdiPzL7vPLs2ao7BPZ+a0GDvpp+f+/T/EoVIHgiZoHiXEYmc/n2fmYd7Gb0UCa1og2ovhiegLnaFewD2OKMuP/gDuIwvnX9jU093dVupOw1muX0wgB+NH4xl7rTB42nvxLZK6N/ymfqg+LzQnqU+3drEWunSgepvKYem+86aKq2BkoJF+Ng==",
      SMTP_URL:
        "AgDVilgKuupA5C2U/aA69wX3hl3Rbv58xFS7WGeUjq7ubq5meZhRyT3QG3Ly1rXzoPCfB3LDC0JDjRMJ1G2jmn9o0znEXYks/49m6hDaKhcwnnlIE/ThBJ/BBqnZtoAjxzoeBSvaEhV/dd/a7GrIQYiswfT8P3LVza4gKdj1li5vs7htCLnZfOrAgAqfXSxILDfHlEk9lmbL5J4JdYlVKesp6XNjcnUWaP2ycc0vW3qWlwrFU2DJw45wZCoE/76hG2s+Tk3VF5Q6kiNJCKTCf88jpeiggxIpntjLJk8nmrr9/aZ8fl8gDWUYV+15UFgh5jSP0nlWlCTmxAMmEL2lwBb9289rt0o3ZM7L+yfzLGD9QTy/Ns0hm2M4Cynwh0SD1ti/lMv/GO73XFShUO2glHM96isPFqvbBdBGua8ksp59W0TYQRMFFHbygZEj4k5K516w3gV4XonZN6INOqKt4s27R9oiOoFup2mQo0ns1sH7XB8q/wXVmro3km/dqToSOFRa/0v+fZNfzlh1X0JlqI+940CQz7I3rusrFDR5kfryVt0A6AP9tjyG9jQAjiM0lwcJgHrDARpNXuo9qzLf0yDK68NrR49XGWNugRuKHEA8Ka7vLmbeIvZOElsfn/ZCpnWrUNcRO/5dvxIQgNRIKiHVcqM1QV6V31YZMa6ZfJI/zhLaWEoOV0svcYrO9jy9H0rRtrMEqXZO0IQ8pYVfHhNxbA==",
    },
    template: {
      type: "Opaque",
      metadata: {
        annotations: {
          "sealedsecrets.bitnami.com/cluster-wide": "true",
        },
        ...metadataFromParams(params),
        name: `${params.name}-env`,
      },
    },
  },
});

deployment.spec!.template.spec!.containers[0].envFrom = [
  {
    configMapRef: { name: `${params.name}-env` },
  },
  {
    secretRef: { name: `${params.name}-env` },
  },
];

//

export default [secret, deployment, ingress, service, envConfigMap];
