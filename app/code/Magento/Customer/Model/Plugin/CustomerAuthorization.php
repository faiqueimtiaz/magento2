<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Magento\Customer\Model\Plugin;

use Magento\Authorization\Model\UserContextInterface;
use Magento\Customer\Model\CustomerFactory;
use Magento\Integration\Api\AuthorizationServiceInterface as AuthorizationService;
use Magento\Store\Model\StoreManagerInterface;

/**
 * Plugin around \Magento\Framework\Authorization::isAllowed
 *
 * Plugin to allow customer users to access resources with self permission
 */
class CustomerAuthorization
{
    /**
     * @var UserContextInterface
     */
    private $userContext;

    /**
     * @var StoreManagerInterface
     */
    private $storeManager;

    /**
     * @var CustomerFactory
     */
    private $customerFactory;

    /**
     * Inject dependencies.
     *
     * @param UserContextInterface $userContext
     * @param CustomerFactory $customerFactory
     * @param StoreManagerInterface $storeManager
     */
    public function __construct(
        UserContextInterface $userContext,
        CustomerFactory $customerFactory,
        StoreManagerInterface $storeManager
    ) {
        $this->userContext = $userContext;
        $this->customerFactory = $customerFactory;
        $this->storeManager = $storeManager;
    }

    /**
     * Check if resource for which access is needed has self permissions defined in webapi config.
     *
     * @param \Magento\Framework\Authorization $subject
     * @param callable $proceed
     * @param string $resource
     * @param string $privilege
     *
     * @return bool true If resource permission is self, to allow
     * customer access without further checks in parent method
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function aroundIsAllowed(
        \Magento\Framework\Authorization $subject,
        \Closure $proceed,
        $resource,
        $privilege = null
    ) {
        if ($resource == AuthorizationService::PERMISSION_SELF
            && $this->userContext->getUserId()
            && $this->userContext->getUserType() === UserContextInterface::USER_TYPE_CUSTOMER
        ) {
            $customer = $this->customerFactory->create()->load($this->userContext->getUserId());
            $currentStoreId = $this->storeManager->getStore()->getId();
            $sharedStoreIds = $customer->getSharedStoreIds();
            if (in_array($currentStoreId, $sharedStoreIds)) {
                return true;
            }
        }

        return $proceed($resource, $privilege);
    }
}
