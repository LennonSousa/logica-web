import { useContext, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import {
  Col,
  Container,
  Button,
  ButtonGroup,
  Table,
  Row,
} from "react-bootstrap";
import { format } from "date-fns";
import {
  FaCopy,
  FaFileExport,
  FaPencilAlt,
  FaPlug,
  FaStickyNote,
  FaSolarPanel,
  FaCashRegister,
  FaMoneyBillWave,
  FaClipboardList,
  FaPrint,
} from "react-icons/fa";

import api from "../../../api/api";
import { TokenVerify } from "../../../utils/tokenVerify";
import { SideBarContext } from "../../../contexts/SideBarContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { can } from "../../../components/Users";
import { Estimate } from "../../../components/Estimates";
import Members from "../../../components/EstimateMembers";
import PageBack from "../../../components/PageBack";
import { PageWaiting, PageType } from "../../../components/PageWaiting";
import { prettifyCurrency } from "../../../components/InputMask/masks";
import {
  calculate,
  calcFinalTotal,
  ConsumptionCalcProps,
  CalcResultProps,
  CalcProps,
} from "../../../utils/calcEstimate";

interface tranlatedCustomerFrom {
  name: string;
  translate: string;
}

const tranlatedsCustomerFrom: tranlatedCustomerFrom[] = [
  {
    name: "site",
    translate: "Nosso site",
  },
  {
    name: "social",
    translate: "Redes sociais",
  },
  {
    name: "customer",
    translate: "Outros clientes",
  },
  {
    name: "internet",
    translate: "Buscas na internet",
  },
  {
    name: "street",
    translate: "TV / Propaganda nas ruas",
  },
];

const EstimateDetails: NextPage = () => {
  const router = useRouter();
  const { estimate } = router.query;

  const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
  const { loading, user } = useContext(AuthContext);

  const [data, setData] = useState<Estimate>();
  const [documentType, setDocumentType] = useState("CPF");
  const [calcResults, setCalcResults] = useState<CalcResultProps>();

  const [finalTotal, setFinalTotal] = useState(0);

  const [loadingData, setLoadingData] = useState(true);
  const [hasErrors, setHasErrors] = useState(false);
  const [typeLoadingMessage, setTypeLoadingMessage] =
    useState<PageType>("waiting");
  const [textLoadingMessage, setTextLoadingMessage] = useState(
    "Aguarde, carregando..."
  );

  useEffect(() => {
    if (user) {
      handleItemSideBar("estimates");
      handleSelectedMenu("estimates-index");

      if (
        can(user, "estimates", "read:any") ||
        can(user, "estimates", "read:own")
      ) {
        if (estimate) {
          api
            .get(`estimates/${estimate}`)
            .then((res) => {
              const estimateRes: Estimate = res.data;

              if (estimateRes.document.length > 14) setDocumentType("CNPJ");

              setData(estimateRes);

              const values: ConsumptionCalcProps = {
                kwh: Number(estimateRes.kwh),
                irradiation: Number(estimateRes.irradiation),
                panel: estimateRes.panel,
                month_01: Number(estimateRes.month_01),
                month_02: Number(estimateRes.month_02),
                month_03: Number(estimateRes.month_03),
                month_04: Number(estimateRes.month_04),
                month_05: Number(estimateRes.month_05),
                month_06: Number(estimateRes.month_06),
                month_07: Number(estimateRes.month_07),
                month_08: Number(estimateRes.month_08),
                month_09: Number(estimateRes.month_09),
                month_10: Number(estimateRes.month_10),
                month_11: Number(estimateRes.month_11),
                month_12: Number(estimateRes.month_12),
                month_13: Number(estimateRes.month_13),
                averageIncrease: Number(estimateRes.average_increase),
                roofOrientation: estimateRes.roof_orientation,
              };

              const newCalcProps = {
                discount_percent: estimateRes.discount_percent,
                discount: estimateRes.discount,
                increase_percent: estimateRes.increase_percent,
                increase: estimateRes.increase,
                estimateItems: estimateRes.items,
              };

              handleCalcEstimate(values, newCalcProps, false);

              setLoadingData(false);
            })
            .catch((err) => {
              console.log("Error to get estimate: ", err);

              setTypeLoadingMessage("error");
              setTextLoadingMessage(
                "Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos."
              );
              setHasErrors(true);
            });
        }
      }
    }
  }, [user, estimate]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCalcEstimate(
    values: ConsumptionCalcProps,
    newCalcProps: CalcProps,
    updateInversor: boolean
  ) {
    const newCalcResults = calculate(
      values,
      newCalcProps.estimateItems,
      updateInversor
    );

    if (newCalcResults) {
      setCalcResults(newCalcResults);

      handleFinalTotal(
        newCalcResults.systemInitialPrice,
        newCalcProps.discount_percent,
        newCalcProps.discount,
        newCalcProps.increase_percent,
        newCalcProps.increase
      );
    }
  }

  function handleFinalTotal(
    subTotal: number,
    newDiscountPercent: boolean,
    newDiscount: number,
    newIncreasePercent: boolean,
    newIncrease: number
  ) {
    const newFinalTotal = calcFinalTotal(
      subTotal,
      newDiscountPercent,
      newDiscount,
      newIncreasePercent,
      newIncrease
    );

    setFinalTotal(newFinalTotal);
  }

  function handleRoute(route: string) {
    router.push(route);
  }

  return (
    <>
      <NextSeo
        title="Detalhes do orçamento"
        description="Detalhes do orçamento da plataforma de gerenciamento da Lógica Renováveis."
        openGraph={{
          url: "https://app.logicarenovaveis.com",
          title: "Detalhes do orçamento",
          description:
            "Detalhes do orçamento da plataforma de gerenciamento da Lógica Renováveis.",
          images: [
            {
              url: "https://app.logicarenovaveis.com/assets/images/logo-logica.jpg",
              alt: "Detalhes do orçamento | Plataforma Lógica Renováveis",
            },
            {
              url: "https://app.logicarenovaveis.com/assets/images/logo-logica.jpg",
            },
          ],
        }}
      />

      {!user || loading ? (
        <PageWaiting status="waiting" />
      ) : (
        <>
          {can(user, "estimates", "read:any") ||
          can(user, "estimates", "read:own") ? (
            <>
              {loadingData || hasErrors ? (
                <PageWaiting
                  status={typeLoadingMessage}
                  message={textLoadingMessage}
                />
              ) : (
                <>
                  {!data ? (
                    <PageWaiting status="waiting" />
                  ) : (
                    <Container className="content-page">
                      <Row>
                        <Col>
                          <Row className="mb-3">
                            <Col>
                              <PageBack
                                href="/estimates"
                                subTitle="Voltar para a lista de orçamentos"
                              />
                            </Col>

                            <Col className="col-row">
                              <ButtonGroup className="col-12">
                                {can(user, "estimates", "update:any") && (
                                  <Button
                                    title="Editar orçamento."
                                    variant="success"
                                    onClick={() =>
                                      handleRoute(`/estimates/edit/${data.id}`)
                                    }
                                  >
                                    <FaPencilAlt />
                                  </Button>
                                )}

                                {can(user, "estimates", "create") && (
                                  <Button
                                    title="Clonar orçamento."
                                    variant="success"
                                    onClick={() =>
                                      handleRoute(
                                        `/estimates/new?from=${data.id}`
                                      )
                                    }
                                  >
                                    <FaCopy />
                                  </Button>
                                )}

                                {can(user, "projects", "create") && (
                                  <Button
                                    title="Criar projeto."
                                    variant="success"
                                    onClick={() =>
                                      handleRoute(
                                        `/projects/new?from=${data.id}`
                                      )
                                    }
                                  >
                                    <FaFileExport />
                                  </Button>
                                )}

                                <Button
                                  title="Imprimir orçamento."
                                  variant="success"
                                  onClick={() =>
                                    handleRoute(`/estimates/print/${data.id}`)
                                  }
                                >
                                  <FaPrint />
                                </Button>
                              </ButtonGroup>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col>
                              <Row>
                                <Col>
                                  <h6 className="text-success">Vendedor</h6>
                                </Col>
                              </Row>
                              <Row>
                                {data.user && <Members user={data.user} />}
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={6}>
                              <h3 className="form-control-plaintext text-success text-wrap">
                                {data.customer}
                              </h3>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    {documentType}
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.document}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Como nos conheceu?
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {
                                      tranlatedsCustomerFrom.find((item) => {
                                        return item.name === data.customer_from;
                                      })?.translate
                                    }
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">Celular</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.phone}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Celular secundário
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.cellphone}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">E-mail</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.email}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Outros contatos
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary text-wrap">
                                    {data.contacts}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={2}>
                              <Row>
                                <Col>
                                  <span className="text-success">CEP</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.zip_code}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={8}>
                              <Row>
                                <Col>
                                  <span className="text-success">Rua</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary text-wrap">
                                    {data.street}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={2}>
                              <Row>
                                <Col>
                                  <span className="text-success">Número</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.number}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Complemento
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary text-wrap">
                                    {data.complement}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={6}>
                              <Row>
                                <Col>
                                  <span className="text-success">Bairro</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary text-wrap">
                                    {data.neighborhood}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={2}>
                              <Row>
                                <Col>
                                  <span className="text-success">Cidade</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary text-wrap">
                                    {data.city}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">Estado</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.state}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mt-3 mb-3">
                            <Col>
                              <h6 className="text-success">
                                Consumo <FaPlug />
                              </h6>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Concessionária de energia
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.energy_company}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Unidade consumidora (UC)
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.unity}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Tipo de telhado
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.roof_type.name}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Valor unitário do Quilowatts/Hora
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {`R$ ${Intl.NumberFormat("pt-BR", {
                                      minimumFractionDigits: 2,
                                    }).format(data.kwh)}`}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Irradiação Local em [Kwh/m².dia]
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.irradiation))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Painel</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${
                                    data.panel.name
                                  } - ${prettifyCurrency(
                                    String(data.panel.capacity)
                                  )} W`}</h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Orientação do telhado
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.roof_orientation.name}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 01</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_01))}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 02</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_02))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 03</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_03))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 04</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_04))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 05</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_05))}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 06</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_06))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 07</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_07))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 08</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_08))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 09</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_09))}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 10</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_10))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 11</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_11))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 12</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_12))}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Mês 13</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(String(data.month_13))}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Média</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(
                                      calcResults
                                        ? calcResults.monthsAverageKwh.toFixed(
                                            2
                                          )
                                        : "0.00"
                                    )}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Previsão de aumento
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(
                                      String(data.average_increase)
                                    )}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Consumo final
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {prettifyCurrency(
                                      calcResults
                                        ? calcResults.finalAverageKwh.toFixed(2)
                                        : "0.00"
                                    )}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mt-3 mb-3">
                            <Col>
                              <h6 className="text-success">
                                Projeto <FaSolarPanel />
                              </h6>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Valor médio mensal da conta de energia
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {`R$ ${prettifyCurrency(
                                      calcResults
                                        ? calcResults.monthlyPaid.toFixed(2)
                                        : "0.00"
                                    )}`}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Valor pago anualmente
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`R$ ${prettifyCurrency(
                                    calcResults
                                      ? calcResults.yearlyPaid.toFixed(2)
                                      : "0.00"
                                  )}`}</h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Número total de Painéis Fotovoltaicos
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${prettifyCurrency(
                                    calcResults
                                      ? calcResults.panelsAmount.toFixed(2)
                                      : "0.00"
                                  )} Un`}</h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Capacidade Total do Sistema Fotovoltaico
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {`${prettifyCurrency(
                                      calcResults
                                        ? calcResults.systemCapacityKwp.toFixed(
                                            2
                                          )
                                        : "0.00"
                                    )} kWp`}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Total de energia gerada mensalmente
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${prettifyCurrency(
                                    calcResults
                                      ? calcResults.monthlyGeneratedEnergy.toFixed(
                                          2
                                        )
                                      : "0.00"
                                  )} Kwh`}</h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Total de energia gerada anualmente
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${prettifyCurrency(
                                    calcResults
                                      ? calcResults.yearlyGeneratedEnergy.toFixed(
                                          2
                                        )
                                      : "0.00"
                                  )} Kwh`}</h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Redução de emissão de gás CO² ao ano
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {`${prettifyCurrency(
                                      calcResults
                                        ? calcResults.co2Reduction.toFixed(2)
                                        : "0.00"
                                    )} Kg`}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Área ocupada pelo sistema
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${prettifyCurrency(
                                    calcResults
                                      ? calcResults.systemArea.toFixed(2)
                                      : "0.00"
                                  )} m²`}</h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Capacidade arredondada do Sistema
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${prettifyCurrency(
                                    calcResults
                                      ? calcResults.finalSystemCapacityKwp.toFixed(
                                          2
                                        )
                                      : "0.00"
                                  )} kWp`}</h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row>
                            <Col>
                              <h6 className="text-success">
                                Itens <FaClipboardList />
                              </h6>
                            </Col>
                          </Row>

                          <Table striped hover size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Quantidade</th>
                                <th>Produto</th>
                                <th>Unitário</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.items.map((item, index) => {
                                const total = item.amount * item.price;

                                return (
                                  <tr key={index}>
                                    <td>
                                      {prettifyCurrency(
                                        Number(item.amount).toFixed(2)
                                      )}
                                    </td>
                                    <td>{item.name}</td>
                                    <td>{`R$ ${prettifyCurrency(
                                      Number(item.price).toFixed(2)
                                    )}`}</td>
                                    <td>{`R$ ${prettifyCurrency(
                                      total.toFixed(2)
                                    )}`}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Exibir valores dos itens no orçamento?
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.show_values ? "Sim" : "Não"}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col>
                              <h6 className="text-success">
                                Valores <FaCashRegister />
                              </h6>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Subtotal</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {`R$ ${prettifyCurrency(
                                      calcResults
                                        ? calcResults.systemInitialPrice.toFixed(
                                            2
                                          )
                                        : "0.00"
                                    )}`}{" "}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">Desconto</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${
                                    data.discount_percent ? "" : "R$ "
                                  }${prettifyCurrency(String(data.discount))} ${
                                    data.discount_percent ? "%" : ""
                                  }`}</h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Acréscimo
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">{`${
                                    data.increase_percent ? "" : "R$ "
                                  }${prettifyCurrency(String(data.increase))} ${
                                    data.increase_percent ? "%" : ""
                                  }`}</h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={3}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Exibir descontos no orçamento?
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.show_discount ? "Sim" : "Não"}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col>
                              <h6 className="text-success">
                                Valor final do sitema <FaMoneyBillWave />
                              </h6>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col>
                              <h6 className="text-secondary">
                                {`R$ ${prettifyCurrency(
                                  finalTotal.toFixed(2)
                                )}`}{" "}
                              </h6>
                            </Col>
                          </Row>

                          <Col className="border-top mt-3 mb-3"></Col>

                          <Row className="mb-3">
                            <Col>
                              <Row>
                                <Col>
                                  <h6 className="text-success">
                                    Observação {data.notes && <FaStickyNote />}
                                  </h6>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <span className="text-secondary text-wrap">
                                    {data.notes}
                                  </span>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={6}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Fase do orçamento
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.status.name}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            {!user.store_only && (
                              <Col sm={6}>
                                <Row>
                                  <Col>
                                    <span className="text-success">Loja</span>
                                  </Col>
                                </Row>

                                <Row>
                                  <Col>
                                    <h6 className="text-secondary">
                                      {data.store.name}
                                    </h6>
                                  </Col>
                                </Row>
                              </Col>
                            )}
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Criado em
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {format(
                                      new Date(data.created_at),
                                      "dd/MM/yyyy"
                                    )}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">Usuário</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.created_by}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>

                          <Row className="mb-3">
                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">
                                    Última atualização
                                  </span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {format(
                                      new Date(data.updated_at),
                                      "dd/MM/yyyy"
                                    )}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>

                            <Col sm={4}>
                              <Row>
                                <Col>
                                  <span className="text-success">Usuário</span>
                                </Col>
                              </Row>

                              <Row>
                                <Col>
                                  <h6 className="text-secondary">
                                    {data.updated_by}
                                  </h6>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Container>
                  )}
                </>
              )}
            </>
          ) : (
            <PageWaiting status="warning" message="Acesso negado!" />
          )}
        </>
      )}
    </>
  );
};

export default EstimateDetails;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.req.cookies;

  const tokenVerified = await TokenVerify(token);

  if (tokenVerified === "not-authorized") {
    // Not authenticated, token invalid!
    return {
      redirect: {
        destination: `/?returnto=${context.req.url}`,
        permanent: false,
      },
    };
  }

  if (tokenVerified === "error") {
    // Server error!
    return {
      redirect: {
        destination: "/500",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
