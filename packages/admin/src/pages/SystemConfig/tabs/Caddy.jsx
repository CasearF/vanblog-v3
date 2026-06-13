import {
  clearCaddyLog,
  deleteHttpsCert,
  getCaddyConfig,
  getCaddyLog,
  getHttpsCerts,
  getHttpsConfig,
  setHttpsConfig,
  uploadHttpsCert,
} from '@/services/van-blog/api';
import ProForm, { ProFormSwitch } from '@ant-design/pro-form';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Upload,
} from 'antd';
import lodash from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';

export default function (props) {
  const [loading, setLoading] = useState(false);
  const [curData, setCurData] = useState(null);
  const [form] = ProForm.useForm();
  const { initialState } = useModel('@@initialState');
  const cls = useMemo(() => {
    if (initialState?.settings?.navTheme != 'light') {
      return 'dark-switch';
    } else {
      return '';
    }
  }, [initialState]);

  // ===== 手动上传 HTTPS 证书 =====
  const [certList, setCertList] = useState([]);
  const [certLoading, setCertLoading] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [certForm] = Form.useForm();

  const loadCerts = async () => {
    setCertLoading(true);
    try {
      const { data: res } = await getHttpsCerts();
      setCertList(res || []);
    } catch (err) {
      // 框架会就地提示错误信息
    } finally {
      setCertLoading(false);
    }
  };

  useEffect(() => {
    loadCerts();
  }, []);

  // 读取本地文件内容填入对应表单项，return false 阻止 antd 自动上传。
  const readFileInto = (file, field) => {
    const reader = new FileReader();
    reader.onload = (e) => certForm.setFieldsValue({ [field]: e.target?.result });
    reader.readAsText(file);
    return false;
  };

  const submitUploadCert = async () => {
    let values;
    try {
      values = await certForm.validateFields();
    } catch (err) {
      return;
    }
    setUploading(true);
    try {
      await uploadHttpsCert(values);
      message.success('上传成功！该域名已改用上传的证书。');
      setUploadVisible(false);
      certForm.resetFields();
      loadCerts();
    } catch (err) {
      // statusCode!=200 时框架会抛出，error 里带服务端校验信息（如证书与私钥不匹配）。
      message.error(err?.data?.message || err?.info?.errorMessage || '上传失败，请检查证书内容！');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCert = (record) => {
    Modal.confirm({
      title: `确定删除证书（${(record.domains || []).join(', ')}）吗？`,
      content: '删除后该域名将回退到 Caddy 自动按需申请证书（ACME）。',
      onOk: async () => {
        try {
          await deleteHttpsCert(record.id);
          message.success('删除成功！');
          loadCerts();
        } catch (err) {
          message.error(err?.data?.message || '删除失败！');
        }
      },
    });
  };

  const renderExpiry = (notAfter) => {
    if (!notAfter) {
      return '-';
    }
    const date = new Date(notAfter);
    const days = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const dateStr = date.toLocaleDateString();
    if (days < 0) {
      return <Tag color="red">已过期（{dateStr}）</Tag>;
    }
    if (days <= 14) {
      return <Tag color="orange">{days} 天后过期（{dateStr}）</Tag>;
    }
    return <Tag color="green">有效至 {dateStr}</Tag>;
  };

  const certColumns = [
    {
      title: '域名',
      dataIndex: 'domains',
      render: (domains) => (domains || []).map((d) => <Tag key={d}>{d}</Tag>),
    },
    {
      title: '颁发者',
      dataIndex: 'issuer',
      ellipsis: true,
      render: (issuer, record) =>
        record.isSelfSigned ? <Tag color="purple">自签名</Tag> : <span title={issuer}>{issuer}</span>,
    },
    {
      title: '有效期',
      dataIndex: 'notAfter',
      render: renderExpiry,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDeleteCert(record)}>
          删除
        </Button>
      ),
    },
  ];

  const updateHttpsConfig = async (data) => {
    setLoading(true);
    try {
      if (data.redirect) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setTimeout(() => {
          window.location.replace(`http://${location.host}${location.pathname}`);
        }, 2000);
      }
      await setHttpsConfig(data);
      message.success('更改成功！将自动刷新至新协议');
      // let text = '关闭成功，现在可以通过 http 访问了。';
      // if (data.redirect) {
      //   text =
      //     '开启成功，现在通过 http 的访问将自动重定向到 https，这可能会导致无法通过 https + ip 访问本站。';
      // }
      // Modal.success({
      //   title: '更新成功！',
      //   content: text,
      // });
      return true;
    } catch (err) {
      message.error('更新失败！');
      return false;
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
    <Card title="HTTPS 相关配置">
      <Alert
        type="info"
        message={
          <div>
            <p>
              VanBlog 是通过{' '}
              <a target={'_blank'} rel="noreferrer" href="https://caddyserver.com/">
                Caddy
              </a>{' '}
              实现的证书全自动按需申请。
              <a
                target={'_blank'}
                rel="noreferrer"
                href="https://vanblog.mereith.com/guide/https.html"
              >
                相关文档
              </a>
            </p>
            <p>高级玩家可点击按钮查看 Caddy 运行日志或配置排查错误。</p>
            <p>access 日志可进入容器 /var/log/vanblog-access.log 查看</p>
          </div>
        }
        style={{ marginBottom: 20 }}
      />
      <Alert
        type="warning"
        message={
          <div>
            <p>请确保 80/443 端口处于开放状态。</p>
            <p>
              第一次通过某域名 https
              访问时，如果没有证书会自动申请证书的。你也可以点击下面的按钮手动触发证书申请。
            </p>
            <p>稳定后可打开 https 自动重定向功能，开启通过 http 访问将自动跳转至 https </p>
            <p>如果你用了 80 端口反代，请不要开启 https 自动重定向！否则你的反代可能会失效。</p>
            <p>
              如果不小心开启了此选项后关不掉，可以参考：
              <a
                href="https://vanblog.mereith.com/faq/usage.html#开启了-https-重定向后关不掉"
                target="_blank"
              >
                开启了 https 重定向后关不掉
              </a>
            </p>
          </div>
        }
        style={{ marginBottom: 20 }}
      />

      <Spin spinning={loading}>
        <ProForm
          form={form}
          request={async () => {
            setLoading(true);
            try {
              const { data: res } = await getHttpsConfig();
              setLoading(false);
              if (!res) {
                setCurData({
                  redirect: false,
                });
                return {
                  redirect: false,
                };
              }
              setCurData(res);

              return res;
            } catch (err) {
              setLoading(false);
            }
          }}
          layout="horizontal"
          onFinish={async (data) => {
            if (location.hostname == 'blog-demo.mereith.com') {
              Modal.warning({
                title: '演示站不可修改此选项，不然怕 k8s ingress 失效',
              });
              setLoading(false);
              return;
            }
            const eq = lodash.isEqual(curData, data);

            if (eq) {
              Modal.warning({
                title: '未修改任何信息，无需保存！',
              });
              setLoading(false);
              return;
            }
            let text =
              '确定关闭 https 自动重定向吗？关闭后可通过 http 进行访问。点击确定后 2 秒将自动切换到 http 访问';
            if (data.redirect) {
              text =
                '开启 https 自动重定向之前，请确保通过域名可正常用 https 访问本站。开启将无法使用 http 访问本站。点击确定后 2 秒将自动切换到 https 访问。注意如果是自己反代了 80 端口的话，请务必不要开启此项！';
            }
            Modal.confirm({
              title: text,
              onOk: () => {
                updateHttpsConfig(data);
              },
            });
          }}
          submitter={{
            searchConfig: {
              submitText: '保存',
            },
            render: (props, doms) => {
              return (
                <>
                  <Row>
                    <Space>
                      <>{doms}</>
                      <Button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const { data: res } = await getCaddyConfig();
                            if (res) {
                              Modal.info({
                                title: 'Caddy 配置',
                                content: (
                                  <Input.TextArea
                                    autoSize={{ maxRows: 20, minRows: 15 }}
                                    value={res}
                                  />
                                ),
                              });
                            }
                          } catch (err) {
                            message.error('获取 Caddy 配置错误！');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        type="primary"
                      >
                        查看 Caddy 配置
                      </Button>
                    </Space>
                  </Row>
                  <Row style={{ marginTop: 10 }}>
                    <Space>
                      <Button
                        type="primary"
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const { data: res } = await getCaddyLog();
                            if (res || res == '') {
                              Modal.info({
                                title: 'Caddy 运行日志',
                                content: (
                                  <Input.TextArea
                                    autoSize={{ maxRows: 20, minRows: 15 }}
                                    value={res}
                                  />
                                ),
                              });
                            } else {
                              message.error('获取 Caddy 日志错误！');
                            }
                          } catch (err) {
                            message.error('获取 Caddy 日志错误！');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        查看 Caddy 日志
                      </Button>
                      <Button
                        danger
                        type="primary"
                        onClick={async () => {
                          Modal.confirm({
                            title: '确定清除 Caddy 运行日志吗？清除后将无法恢复！',
                            onOk: async () => {
                              await clearCaddyLog();
                              message.success('清除 Caddy 运行日志成功！');
                            },
                          });
                        }}
                      >
                        清除 Caddy 日志
                      </Button>
                    </Space>
                  </Row>
                  <Row style={{ marginTop: 10 }}>
                    <Button
                      type="primary"
                      onClick={async () => {
                        Modal.confirm({
                          title: '触发证书按需申请',
                          content:
                            '点击确认后将打开新窗口并用 https 访问当前网址以触发证书按需申请。触发请后稍等一会（申请时间取决于网络环境），申请完成后弹出页面将通过 https 正常加载。',
                          onOk: () => {
                            window.open(`https://${window.location.host}`, '_blank');
                          },
                        });
                      }}
                    >
                      使用当前访问域名触发按需申请
                    </Button>
                  </Row>
                </>
              );
            },
          }}
        >
          <ProFormSwitch
            label="HTTPS 自动重定向"
            name="redirect"
            tooltip="开启后通过 http 访问本站将自动重定向至 https"
            fieldProps={{
              className: cls,
            }}
          ></ProFormSwitch>
          {/* <ProFormSelect
            name="domains"
            mode="tags"
            disabled
            width={'lg'}
            label="自动 HTTPS 域名"
            tooltip="开启自动 HTTPS 域名，内置的 Caddy 会自动申请证书并应用"
            placeholder={'添加后，内置的 Caddy 会自动申请证书并应用'}
          /> */}
          {/* <ProFormTextArea
            disabled
            name="caddyConfig"
            label={
              <a
                href="https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E8%87%AA%E5%8A%A8%E7%94%9F%E6%88%90"
                target={'_blank'}
                rel="norefferrer"
              >
                Caddy 配置
              </a>
            }
            tooltip={'内置 Caddy2 配置，不懂忽略就行'}
            placeholder="内置 Caddy2 配置，不懂忽略就行"
            fieldProps={{
              autoSize: {
                minRows: 10,
                maxRows: 30,
              },
            }}
          /> */}
        </ProForm>
      </Spin>
    </Card>

    <Card title="手动上传 HTTPS 证书" style={{ marginTop: 20 }}>
      <Alert
        type="info"
        message={
          <div>
            <p>
              当 Caddy 自动按需申请（ACME）走不通时使用本功能：内网 / 纯 IP / 自签 CA / 通配符证书等场景。
            </p>
            <p>
              上传后对应域名会立即改用你提供的证书做 TLS（无需重启），其它域名仍走自动 HTTPS。删除证书后该域名回退自动申请。
            </p>
            <p>私钥仅安全存储在服务器数据卷内，权限收紧、不会在任何接口回显或写入日志。</p>
          </div>
        }
        style={{ marginBottom: 16 }}
      />
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          onClick={() => {
            certForm.resetFields();
            setUploadVisible(true);
          }}
        >
          上传证书
        </Button>
        <Button onClick={loadCerts}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        size="small"
        loading={certLoading}
        dataSource={certList}
        columns={certColumns}
        pagination={false}
        locale={{ emptyText: '暂无手动证书（当前由 Caddy 自动按需申请）' }}
      />
    </Card>

    <Modal
      title="上传 HTTPS 证书"
      visible={uploadVisible}
      confirmLoading={uploading}
      onOk={submitUploadCert}
      onCancel={() => setUploadVisible(false)}
      okText="上传"
      cancelText="取消"
      destroyOnClose
      width={680}
    >
      <Form form={certForm} layout="vertical">
        <Form.Item
          label="证书 PEM（含完整证书链）"
          name="cert"
          rules={[{ required: true, message: '请粘贴或上传证书 PEM' }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 6, maxRows: 12 }}
            placeholder="-----BEGIN CERTIFICATE-----"
          />
        </Form.Item>
        <Upload beforeUpload={(file) => readFileInto(file, 'cert')} showUploadList={false} accept=".pem,.crt,.cer,.txt">
          <Button size="small">从文件读取证书</Button>
        </Upload>
        <Form.Item
          label="私钥 PEM"
          name="key"
          style={{ marginTop: 16 }}
          rules={[{ required: true, message: '请粘贴或上传私钥 PEM' }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 6, maxRows: 12 }}
            placeholder="-----BEGIN PRIVATE KEY-----"
          />
        </Form.Item>
        <Upload beforeUpload={(file) => readFileInto(file, 'key')} showUploadList={false} accept=".pem,.key,.txt">
          <Button size="small">从文件读取私钥</Button>
        </Upload>
        <Form.Item label="备注（可选）" name="remark" style={{ marginTop: 16 }}>
          <Input placeholder="如：通配符证书 *.example.com" />
        </Form.Item>
        <Alert
          type="warning"
          showIcon
          message="上传后会校验证书与私钥是否匹配、是否在有效期内，通过后立即生效。"
        />
      </Form>
    </Modal>
    </>
  );
}
